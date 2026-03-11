import { NextResponse } from 'next/server';

export function middleware(req) {
    const { pathname } = req.nextUrl;

    // Paths that are ALWAYS public (victim links, assets, login page, auth api)
    const isPublicPath =
        pathname.startsWith('/temu/') ||
        pathname.includes('.') ||
        pathname === '/login' ||
        pathname === '/api/auth';

    if (isPublicPath) {
        return NextResponse.next();
    }

    // Check for authentication cookie
    const authToken = req.cookies.get('auth_token');

    if (!authToken || authToken.value !== 'valid_session') {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (except /api/auth)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
