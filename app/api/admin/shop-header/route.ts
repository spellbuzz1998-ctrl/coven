import { NextResponse } from 'next/server'
import { getShopSetting, setShopSetting } from '@/lib/db'

const KEYS = ['shop_name', 'shop_tagline', 'shop_badge'] as const

export async function GET() {
  const result: Record<string, string> = {}
  for (const key of KEYS) {
    result[key] = getShopSetting(key) ?? ''
  }
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const body = await req.json()
  for (const key of KEYS) {
    if (typeof body[key] === 'string') {
      const val = body[key].trim()
      if (val) {
        setShopSetting(key, val)
      } else {
        setShopSetting(key, '')
      }
    }
  }
  return NextResponse.json({ ok: true })
}
