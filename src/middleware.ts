import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — no auth needed
  const publicRoutes = ['/', '/login', '/register', '/error'];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthApi = pathname.startsWith('/api/auth');
  const isPublicAsset = pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/logo') || pathname.startsWith('/og-');

  if (isPublicRoute || isAuthApi || isPublicAsset) {
    return NextResponse.next();
  }

  // Check JWT token (doesn't require DB connection)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Admin routes — check role from JWT
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (token.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg|og-image.png).*)'],
};
