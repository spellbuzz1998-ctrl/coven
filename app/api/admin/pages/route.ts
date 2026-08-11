import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { PAGE_DEFAULTS } from '@/lib/pageContent'

const VALID_SLUGS = ['terms', 'disclaimer', 'refund-policy', 'privacy-policy']

function upsert(key: string, value: string) {
  const db = getDb()
  db.prepare(`INSERT INTO shop_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
    .run(key, value, new Date().toISOString())
}

export async function GET() {
  const db = getDb()
  const keys = VALID_SLUGS.map(s => `page_${s}`)
  const rows = db.prepare(`SELECT key, value FROM shop_settings WHERE key IN (${keys.map(() => '?').join(',')})`)
    .all(...keys) as { key: string; value: string }[]
  const saved: Record<string, string> = {}
  for (const r of rows) saved[r.key] = r.value
  // Pre-fill with the current default content when no override has been saved yet,
  // so the admin editor always shows the live page content (never blank).
  const result: Record<string, string> = {}
  for (const slug of VALID_SLUGS) {
    const key = `page_${slug}`
    result[key] = saved[key]?.trim() ? saved[key] : (PAGE_DEFAULTS[slug] ?? '')
  }
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { slug, content } = await req.json()
  if (!VALID_SLUGS.includes(slug)) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  upsert(`page_${slug}`, content)
  return NextResponse.json({ ok: true })
}
