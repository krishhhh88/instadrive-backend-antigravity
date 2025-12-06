import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { pbkdf2Sync, randomBytes } from 'node:crypto';

function hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

export async function POST(request: Request) {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });

        const token = signToken({ id: user.id, email: user.email });

        const cookieStore = await cookies();
        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: true, // Always secure for cross-site
            sameSite: 'none', // Required for cross-site
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        // Handle BigInt serialization for JSON
        const safeUser = JSON.parse(JSON.stringify(user, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value // return everything else unchanged
        ));

        return NextResponse.json({ user: safeUser });
    } catch (error: any) {
        console.error('Registration error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return NextResponse.json({
            error: 'Registration failed',
            details: error.message
        }, { status: 500 });
    }
}
