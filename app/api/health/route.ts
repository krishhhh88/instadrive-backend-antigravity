import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Attempt a simple query to check DB connection
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({ status: 'healthy', database: 'connected' }, { status: 200 });
    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json(
            { status: 'unhealthy', database: 'disconnected', error: (error as Error).message },
            { status: 500 }
        );
    }
}
