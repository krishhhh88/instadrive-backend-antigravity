import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { listVideoFiles } from '@/lib/google';

export async function GET() {
    const authUser = await verifyAuth();
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const files = await listVideoFiles(authUser.id);
        return NextResponse.json({ files });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }
}
