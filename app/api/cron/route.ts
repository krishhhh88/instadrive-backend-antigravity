import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPublicVideoUrl } from '@/lib/google';
import { publishReelToInstagram } from '@/lib/instagram';

export async function POST(request: Request) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();

        // Find all pending posts that should be published
        const postsToPublish = await prisma.post.findMany({
            where: {
                status: 'PENDING',
                scheduledTime: {
                    lte: now,
                },
            },
            include: {
                user: true,
            },
        });

        const results = [];

        for (const post of postsToPublish) {
            try {
                // Get public URL for the video
                const videoUrl = await getPublicVideoUrl(post.user.id, post.videoUrl);

                // Publish to Instagram
                const result = await publishReelToInstagram(
                    post.user.id,
                    videoUrl,
                    post.caption || undefined
                );

                // Update post status
                await prisma.post.update({
                    where: { id: post.id },
                    data: {
                        status: 'POSTED',
                        instagramPostId: result.mediaId,
                    },
                });

                results.push({
                    postId: post.id,
                    status: 'success',
                    instagramPostId: result.mediaId,
                });
            } catch (error: any) {
                console.error(`Failed to publish post ${post.id}:`, error);

                // Update post status to failed
                await prisma.post.update({
                    where: { id: post.id },
                    data: {
                        status: 'FAILED',
                    },
                });

                results.push({
                    postId: post.id,
                    status: 'failed',
                    error: error.message,
                });
            }
        }

        return NextResponse.json({
            processed: postsToPublish.length,
            results,
        });
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
    }
}
