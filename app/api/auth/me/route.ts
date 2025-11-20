import { NextResponse } from 'next/server';
import { getUser, verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const authUser = await verifyAuth();

    if (!authUser) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: {
            posts: true
        }
    });

    return NextResponse.json({ user });
}
