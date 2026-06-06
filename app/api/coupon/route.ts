import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get('code')
  if (!code) return NextResponse.json({ valid: false })

  const db = getDb()
  const row = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(code.toUpperCase()) as
    { discount_type: string; amount: number } | undefined

  if (!row) return NextResponse.json({ valid: false })
  return NextResponse.json({ valid: true, type: row.discount_type, amount: row.amount })
}
