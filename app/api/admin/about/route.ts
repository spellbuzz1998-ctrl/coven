import { NextResponse } from 'next/server'
import { getShopSetting, setShopSetting } from '@/lib/db'

const KEYS = [
  'about_heading',
  'about_body',
  'about_commitments',
  'about_contact_email',
] as const

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
      setShopSetting(key, body[key].trim())
    }
  }
  return NextResponse.json({ ok: true })
}
