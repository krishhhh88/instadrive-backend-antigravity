import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import axios from 'axios';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=no_code`);
        }

        // Get current authenticated user
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.redirect(`${process.env.FRONTEND_URL}/login?error=not_authenticated`);
        }

        // Exchange code for short-lived token
        const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token',
            new URLSearchParams({
                client_id: process.env.INSTAGRAM_APP_ID!,
                client_secret: process.env.INSTAGRAM_APP_SECRET!,
                grant_type: 'authorization_code',
                redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
                code,
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }
        );

        const { access_token: shortToken, user_id } = tokenResponse.data;

        // Exchange short-lived token for long-lived token
        const longTokenResponse = await axios.get('https://graph.instagram.com/access_token', {
            params: {
                grant_type: 'ig_exchange_token',
                client_secret: process.env.INSTAGRAM_APP_SECRET,
                access_token: shortToken,
            },
        });

        const { access_token: longToken } = longTokenResponse.data;

        // Update user with Instagram tokens
        await prisma.user.update({
            where: { id: authUser.id },
            data: {
                instagramAccessToken: longToken,
                instagramUserId: user_id.toString(),
            },
        });

        return NextResponse.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?instagram=connected`);
    } catch (error) {
        console.error('Instagram OAuth error:', error);
        return NextResponse.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=instagram_failed`);
    }
}
