import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const GUEST_PATHS = ['/auth/login', '/auth/register'];
const PROTECTED_PREFIXES = ['/dashboard', '/users'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('auth_access_token')?.value;
  const userCookie = request.cookies.get('auth_user')?.value;
  
  let user: { role: string } | null = null;
  if (userCookie) {
    try {
      user = JSON.parse(userCookie);
    } catch {}
  }

  const isGuestPath = GUEST_PATHS.some((path) => pathname === path) || pathname.startsWith('/auth/');
  const isProtectedPath = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isProtectedPath) {
    if (!accessToken) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith('/dashboard/admin') && user?.role !== 'admin') {
      const unauthorizedUrl = new URL('/dashboard', request.url);
      unauthorizedUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  if (isGuestPath) {
    if (accessToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
