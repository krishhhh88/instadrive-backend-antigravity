import { NextResponse } from 'next/server';

export async function GET() {
    const appId = process.env.INSTAGRAM_APP_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    const url = `https://api.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${redirectUri}&scope=instagram_business_basic,instagram_business_content_publish&response_type=code`;

    return NextResponse.redirect(url);
}
