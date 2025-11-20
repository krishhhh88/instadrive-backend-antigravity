import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const authUser = await verifyAuth();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
            include: {
                posts: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Count posts by status
        const totalScheduled = await prisma.post.count({
            where: { userId: authUser.id, status: 'PENDING' },
        });

        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - 7);

        const scheduledThisWeek = await prisma.post.count({
            where: {
                userId: authUser.id,
                createdAt: { gte: thisWeekStart },
            },
        });

        const postedCount = await prisma.post.count({
            where: { userId: authUser.id, status: 'POSTED' },
        });

        return NextResponse.json({
            stats: {
                scheduledPosts: totalScheduled,
                scheduledThisWeek,
                totalPosted: postedCount,
            },
            recentActivity: user.posts,
            connections: {
                googleDrive: !!user.googleRefreshToken,
                instagram: !!user.instagramAccessToken,
            },
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
