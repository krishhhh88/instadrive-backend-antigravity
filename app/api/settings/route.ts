import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const authUser = await verifyAuth();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: {
            googleRefreshToken: true,
            instagramAccessToken: true,
        },
    });

    return NextResponse.json({
        googleConnected: !!user?.googleRefreshToken,
        instagramConnected: !!user?.instagramAccessToken,
    });
}
