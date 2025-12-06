import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
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
            return NextResponse.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
        }

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user info
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: userInfo } = await oauth2.userinfo.get();

        if (!userInfo.email) {
            return NextResponse.redirect(`${process.env.FRONTEND_URL}/login?error=no_email_from_google`);
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email: userInfo.email },
        });

        if (!user) {
            // Create new user
            user = await prisma.user.create({
                data: {
                    email: userInfo.email,
                    name: userInfo.name || 'User',
                    password: '', // No password for Google users
                    googleRefreshToken: tokens.refresh_token || undefined,
                    googleAccessToken: tokens.access_token || undefined,
                    googleExpiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : undefined,
                },
            });
        } else {
            // Update existing user tokens
            user = await prisma.user.update({
                where: { email: userInfo.email },
                data: {
                    googleRefreshToken: tokens.refresh_token || undefined,
                    googleAccessToken: tokens.access_token || undefined,
                    googleExpiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : undefined,
                },
            });
        }

        // Generate JWT
        const token = signToken({ id: user.id, email: user.email });

        // Create response with cookie
        const state = searchParams.get('state');

        // ... (existing code)

        // Create response with cookie
        const redirectUrl = state === 'settings'
            ? `${process.env.FRONTEND_URL}/dashboard/settings`
            : `${process.env.FRONTEND_URL}/dashboard`;

        const response = NextResponse.redirect(redirectUrl);

        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Google OAuth error:', error);
        return NextResponse.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`);
    }
}
