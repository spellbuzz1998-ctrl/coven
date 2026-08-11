import { NextRequest, NextResponse } from 'next/server'
import { getAdminPassword, adminSessionToken, safeEqual, ADMIN_COOKIE } from '@/lib/adminAuth'

// Simple in-memory brute-force guard. Enough for a single-instance deployment;
// if this ever runs on multiple instances, move the counter to the database.
const MAX_ATTEMPTS = 8
const WINDOW_MS = 15 * 60 * 1000
const attempts = new Map<string, { count: number; firstAt: number }>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now })
    return false
  }
  entry.count++
  return entry.count > MAX_ATTEMPTS
}

function clearAttempts(ip: string) {
  attempts.delete(ip)
}

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait 15 minutes and try again.' },
      { status: 429 }
    )
  }

  const { password } = await req.json().catch(() => ({}))
  const expected = getAdminPassword()

  if (!expected) {
    return NextResponse.json(
      { error: 'Admin password is not configured. Set ADMIN_PASSWORD in your environment.' },
      { status: 500 }
    )
  }
  if (typeof password !== 'string' || !safeEqual(password, expected)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  clearAttempts(ip)
  const token = await adminSessionToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, token!, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
