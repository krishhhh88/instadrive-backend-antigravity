import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPublicVideoUrl } from '@/lib/google';
import { publishReelToInstagram } from '@/lib/instagram';

export async function POST(request: Request) {
    const authUser = await verifyAuth();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let postId: string | undefined;

    try {
        const body = await request.json();
        postId = body.postId;

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { user: true },
        });

        if (!post || post.userId !== authUser.id) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (post.status === 'POSTED') {
            return NextResponse.json({ error: 'Post already published' }, { status: 400 });
        }

        // Get public URL for the video
        const videoUrl = await getPublicVideoUrl(post.user.id, post.videoUrl);

        // Publish to Instagram
        const result = await publishReelToInstagram(
            post.user.id,
            videoUrl,
            post.caption || undefined
        );

        // Update post status
        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: {
                status: 'POSTED',
                instagramPostId: result.mediaId,
            },
        });

        return NextResponse.json({
            success: true,
            post: updatedPost,
            instagramPostId: result.mediaId,
        });
    } catch (error: any) {
        console.error('Publish error:', error);

        // Update post status to failed if we have a postId
        if (postId) {
            try {
                await prisma.post.update({
                    where: { id: postId },
                    data: { status: 'FAILED' },
                });
            } catch (updateError) {
                console.error('Failed to update post status:', updateError);
            }
        }

        return NextResponse.json(
            { error: 'Failed to publish post', details: error.message },
            { status: 500 }
        );
    }
}
