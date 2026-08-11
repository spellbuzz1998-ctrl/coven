import { NextRequest, NextResponse } from 'next/server'
import { getOAuthClient, saveTokens } from '@/lib/youtube'

// GET /api/auth/youtube/callback — Google redirects here after consent
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/admin?youtube=error', req.url))
  }

  try {
    const oauth2Client = getOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)
    saveTokens(tokens)
    return NextResponse.redirect(new URL('/admin?youtube=connected', req.url))
  } catch (err) {
    console.error('YouTube OAuth error:', err)
    return NextResponse.redirect(new URL('/admin?youtube=error', req.url))
  }
}
