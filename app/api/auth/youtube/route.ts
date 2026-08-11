import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/youtube'

// GET /api/auth/youtube — redirects admin to Google consent screen
export async function GET() {
  const url = getAuthUrl()
  return NextResponse.redirect(url)
}
