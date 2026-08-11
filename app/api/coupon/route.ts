import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get('code')
  if (!code) return NextResponse.json({ valid: false })

  const db = getDb()
  const row = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(code.toUpperCase()) as
    { discount_type: string; amount: number; expires_at: string | null; usage_limit: number | null; used_count: number; min_order_amount: number | null } | undefined

  if (!row) return NextResponse.json({ valid: false })
  if (row.expires_at && Date.now() > new Date(row.expires_at).getTime()) {
    return NextResponse.json({ valid: false, reason: 'expired' })
  }
  if (row.usage_limit != null && row.used_count >= row.usage_limit) {
    return NextResponse.json({ valid: false, reason: 'used_up' })
  }
  return NextResponse.json({ valid: true, type: row.discount_type, amount: row.amount, minOrderAmount: row.min_order_amount })
}
