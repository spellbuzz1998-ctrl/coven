import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

function upsert(key: string, value: string) {
  const db = getDb()
  db.prepare(`INSERT INTO shop_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
    .run(key, value, new Date().toISOString())
}

export async function GET() {
  const db = getDb()
  const row = db.prepare(`SELECT value FROM shop_settings WHERE key = 'video_testimonials'`).get() as { value: string } | undefined
  const testimonials = row ? JSON.parse(row.value) : []
  return NextResponse.json(testimonials)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  upsert('video_testimonials', JSON.stringify(body))
  return NextResponse.json({ ok: true })
}
