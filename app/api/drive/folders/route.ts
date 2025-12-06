import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { listDriveFolders } from '@/lib/google';

export async function GET() {
    const authUser = await verifyAuth();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const folders = await listDriveFolders(authUser.id);
        return NextResponse.json({ folders });
    } catch (error) {
        console.error('Failed to fetch folders:', error);
        return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
    }
}
