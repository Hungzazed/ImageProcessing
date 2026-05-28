import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const GUEST_PATHS = ['/auth/login', '/auth/register'];
const PROTECTED_PREFIXES = ['/dashboard', '/users'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Get access token and user info from cookies
  const accessToken = request.cookies.get('auth_access_token')?.value;
  const userCookie = request.cookies.get('auth_user')?.value;
  
  // Parse user object safely if exists
  let user: { role: string } | null = null;
  if (userCookie) {
    try {
      user = JSON.parse(userCookie);
    } catch {
      // Ignore parse failure
    }
  }

  // 2. Identify if target path is guest-only or protected
  const isGuestPath = GUEST_PATHS.some((path) => pathname === path) || pathname.startsWith('/auth/');
  const isProtectedPath = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  // 3. Apply Auth Guard routing rules
  if (isProtectedPath) {
    if (!accessToken) {
      // Guest attempting to access protected route -> Redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      // Pass original redirect destination
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-Based Access Control (RBAC) Extension Point
    // E.g. restricting '/admin' route to admin role
    if (pathname.startsWith('/dashboard/admin') && user?.role !== 'admin') {
      const unauthorizedUrl = new URL('/dashboard', request.url);
      unauthorizedUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  if (isGuestPath) {
    if (accessToken) {
      // Authenticated user attempting to access guest route -> Redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Allow standard pass-through
  return NextResponse.next();
}

// Config to specify which paths the middleware intercepts
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
