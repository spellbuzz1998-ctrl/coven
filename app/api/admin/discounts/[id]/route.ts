import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// PATCH /api/admin/discounts/[id] — toggle active or update
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const body = await req.json()

  if (body.is_active !== undefined) {
    db.prepare('UPDATE coupons SET is_active = ? WHERE id = ?').run(body.is_active ? 1 : 0, id)
  }
  if (body.amount !== undefined) {
    db.prepare('UPDATE coupons SET amount = ? WHERE id = ?').run(body.amount, id)
  }
  if (body.expires_at !== undefined) {
    db.prepare('UPDATE coupons SET expires_at = ? WHERE id = ?').run(body.expires_at || null, id)
  }

  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id)
  return NextResponse.json({ coupon })
}

// DELETE /api/admin/discounts/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  db.prepare('DELETE FROM coupons WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
