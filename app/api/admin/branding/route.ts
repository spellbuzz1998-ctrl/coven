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
  const rows = db.prepare(`SELECT key, value FROM shop_settings WHERE key IN ('shop_banner_url','shop_avatar_url')`).all() as { key: string; value: string }[]
  const result: Record<string, string> = {}
  for (const r of rows) result[r.key] = r.value
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { key, value } = await req.json()
  if (!['shop_banner_url', 'shop_avatar_url'].includes(key)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }
  upsert(key, value)
  return NextResponse.json({ ok: true })
}
