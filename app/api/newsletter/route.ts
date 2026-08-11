import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const db = getDb()
  try {
    db.prepare(
      `INSERT INTO newsletter_subscribers (email) VALUES (?)
       ON CONFLICT(email) DO UPDATE SET unsubscribed_at = NULL, subscribed_at = datetime('now')`
    ).run(email.trim().toLowerCase())
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
