import { NextRequest, NextResponse } from 'next/server'
import { adminSessionToken, ADMIN_COOKIE } from '@/lib/adminAuth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // The login endpoint must stay reachable without a session
  if (pathname === '/api/admin/login') return NextResponse.next()

  const expected = await adminSessionToken()
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value

  if (!expected || cookie !== expected) {
    // The YouTube OAuth callback is hit by a browser redirect — send it to the
    // admin page rather than returning a bare JSON error.
    if (pathname.startsWith('/api/auth/youtube')) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/admin/:path*', '/api/auth/youtube/:path*', '/api/auth/youtube'],
}
