import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const row = db.prepare(`SELECT value FROM shop_settings WHERE key = ?`).get(`product_testimonials_${id}`) as { value: string } | undefined
  return NextResponse.json(row ? JSON.parse(row.value) : [])
}
