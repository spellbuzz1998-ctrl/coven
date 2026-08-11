import { NextRequest, NextResponse } from 'next/server'
import { getShopSetting, setShopSetting } from '@/lib/db'
import { SOCIAL_PLATFORMS } from '@/lib/social'

export async function GET() {
  const result: Record<string, string> = {}
  for (const p of SOCIAL_PLATFORMS) {
    result[p.key] = getShopSetting(p.settingKey) ?? ''
  }
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  for (const p of SOCIAL_PLATFORMS) {
    if (typeof body[p.key] === 'string') {
      setShopSetting(p.settingKey, body[p.key].trim())
    }
  }
  return NextResponse.json({ ok: true })
}
