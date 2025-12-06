import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const authUser = await verifyAuth();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const schedule = await prisma.schedule.findUnique({
            where: { userId: authUser.id },
        });

        return NextResponse.json({ schedule });
    } catch (error) {
        console.error('Failed to fetch schedule:', error);
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authUser = await verifyAuth();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { enabledDays, timeSlots, captionTemplate, driveFolderId, driveFolderName } = body;

        const schedule = await prisma.schedule.upsert({
            where: { userId: authUser.id },
            update: {
                enabledDays,
                timeSlots,
                captionTemplate,
                driveFolderId,
                driveFolderName,
            },
            create: {
                userId: authUser.id,
                enabledDays,
                timeSlots,
                captionTemplate,
                driveFolderId,
                driveFolderName,
            },
        });

        return NextResponse.json({ schedule });
    } catch (error) {
        console.error('Failed to save schedule:', error);
        return NextResponse.json({ error: 'Failed to save schedule' }, { status: 500 });
    }
}
