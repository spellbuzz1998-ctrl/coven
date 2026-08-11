import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

interface Subscriber {
  id: number
  email: string
  subscribed_at: string
  unsubscribed_at: string | null
}

export async function GET() {
  const db = getDb()
  const subscribers = db.prepare(
    'SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC'
  ).all() as Subscriber[]
  return NextResponse.json({ subscribers })
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const db = getDb()
  db.prepare('DELETE FROM newsletter_subscribers WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
