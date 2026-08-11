import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { randomUUID } from 'crypto'

export interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  amount: number
  description?: string
  offer_type: 'promo_code' | 'shop_sale' | 'abandoned_cart' | 'favorited_item' | 'thank_you'
  usage_limit?: number
  used_count: number
  min_order_amount?: number
  expires_at?: string
  is_active: boolean
  created_at: string
}

// GET /api/admin/discounts — list all coupons + shop settings
export async function GET() {
  const db = getDb()
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all() as Coupon[]

  // Get shop settings
  const settingsRows = db.prepare('SELECT key, value FROM shop_settings').all() as { key: string; value: string }[]
  const settings: Record<string, string> = {}
  for (const row of settingsRows) settings[row.key] = row.value

  return NextResponse.json({ coupons, settings })
}

// POST /api/admin/discounts — create coupon or update shop setting
export async function POST(req: NextRequest) {
  const db = getDb()
  const body = await req.json()

  // Handle shop setting update
  if (body.setting_key) {
    const now = new Date().toISOString()
    db.prepare(`INSERT INTO shop_settings (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
      .run(body.setting_key, body.setting_value, now)
    return NextResponse.json({ ok: true })
  }

  // Create coupon
  const id = randomUUID()
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO coupons (id, code, discount_type, amount, description, offer_type, usage_limit, min_order_amount, expires_at, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    id,
    (body.code as string).toUpperCase().trim(),
    body.discount_type || 'percentage',
    body.amount,
    body.description || null,
    body.offer_type || 'promo_code',
    body.usage_limit || null,
    body.min_order_amount || null,
    body.expires_at || null,
    now,
  )
  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id) as Coupon
  return NextResponse.json({ coupon })
}
