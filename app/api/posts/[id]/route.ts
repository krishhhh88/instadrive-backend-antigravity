import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authUser = await verifyAuth();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { caption, scheduledTime } = body;

        const post = await prisma.post.findUnique({
            where: { id },
        });

        if (!post || post.userId !== authUser.id) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const updatedPost = await prisma.post.update({
            where: { id },
            data: {
                caption: caption !== undefined ? caption : undefined,
                scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
            },
        });

        return NextResponse.json({ post: updatedPost });
    } catch (error) {
        console.error('Update post error:', error);
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authUser = await verifyAuth();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        const post = await prisma.post.findUnique({
            where: { id },
        });

        if (!post || post.userId !== authUser.id) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        await prisma.post.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete post error:', error);
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }
}
