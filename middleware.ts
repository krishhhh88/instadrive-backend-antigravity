import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const origin = request.headers.get('origin') || '';

    // Get allowed origins from environment
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Allow both production frontend and localhost for development
    const allowedOrigins = [
        frontendUrl,
        'http://localhost:5173',  // Development frontend
        'http://localhost:3000',  // Development backend (for testing)
    ];

    // Check if origin is allowed
    const isAllowedOrigin = allowedOrigins.includes(origin);
    const allowedOrigin = isAllowedOrigin ? origin : frontendUrl;

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Origin': allowedOrigin,
                'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
                'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
            },
        });
    }

    // Handle simple requests
    const response = NextResponse.next();

    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    return response;
}

export const config = {
    matcher: '/api/:path*',
};
