import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

function key(id: string) { return `product_testimonials_${id}` }

function upsert(k: string, value: string) {
  const db = getDb()
  db.prepare(`INSERT INTO shop_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
    .run(k, value, new Date().toISOString())
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const row = db.prepare(`SELECT value FROM shop_settings WHERE key = ?`).get(key(id)) as { value: string } | undefined
  return NextResponse.json(row ? JSON.parse(row.value) : [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  upsert(key(id), JSON.stringify(body))
  return NextResponse.json({ ok: true })
}
