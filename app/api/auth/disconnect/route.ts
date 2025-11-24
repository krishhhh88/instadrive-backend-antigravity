import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const authUser = await verifyAuth();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { provider } = await request.json();

        if (!provider || !['google', 'instagram'].includes(provider)) {
            return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
        }

        const updateData: any = {};
        if (provider === 'google') {
            updateData.googleRefreshToken = null;
            updateData.googleAccessToken = null;
            updateData.googleExpiryDate = null;
        } else if (provider === 'instagram') {
            updateData.instagramAccessToken = null;
            updateData.instagramUserId = null;
        }

        await prisma.user.update({
            where: { id: authUser.id },
            data: updateData,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Disconnect error:', error);
        return NextResponse.json({ error: 'Failed to disconnect account' }, { status: 500 });
    }
}
