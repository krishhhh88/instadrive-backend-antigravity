import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export interface AuthUser {
    id: string;
    email: string;
}

export function signToken(user: AuthUser) {
    return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '7d',
    });
}

export async function verifyAuth(): Promise<AuthUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        return decoded;
    } catch (error) {
        return null;
    }
}

export async function getUser() {
    const user = await verifyAuth();
    return user;
}
