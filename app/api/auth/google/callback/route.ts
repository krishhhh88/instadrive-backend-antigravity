import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=no_code`);
        }

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user info
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: userInfo } = await oauth2.userinfo.get();

        // Get current authenticated user
        const authUser = await verifyAuth();
        if (!authUser) {
            return NextResponse.redirect(`${process.env.FRONTEND_URL}/login?error=not_authenticated`);
        }

        // Update user with Google tokens
        await prisma.user.update({
            where: { id: authUser.id },
            data: {
                googleRefreshToken: tokens.refresh_token || undefined,
                googleAccessToken: tokens.access_token || undefined,
                googleExpiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : undefined,
            },
        });

        return NextResponse.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?google=connected`);
    } catch (error) {
        console.error('Google OAuth error:', error);
        return NextResponse.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=google_failed`);
    }
}
