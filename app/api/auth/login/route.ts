import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { pbkdf2Sync } from 'node:crypto';

function verifyPassword(password: string, storedHash: string) {
    const [salt, originalHash] = storedHash.split(':');
    const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === originalHash;
}

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.password) {
            return NextResponse.json({ error: 'Please login with OAuth' }, { status: 400 });
        }

        const isValid = verifyPassword(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
        }

        const token = signToken({ id: user.id, email: user.email });

        const cookieStore = await cookies();
        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
