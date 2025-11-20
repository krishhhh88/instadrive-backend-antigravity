import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const authUser = await verifyAuth();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
        where: { userId: authUser.id },
        orderBy: { scheduledTime: 'asc' },
    });

    return NextResponse.json({ posts });
}

export async function POST(request: Request) {
    const authUser = await verifyAuth();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { videoUrl, videoName, caption, scheduledTime } = body;

        const post = await prisma.post.create({
            data: {
                userId: authUser.id,
                videoUrl,
                videoName,
                caption,
                scheduledTime: new Date(scheduledTime),
                status: 'PENDING',
            },
        });

        return NextResponse.json({ post });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}
