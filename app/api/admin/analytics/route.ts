import { NextRequest, NextResponse } from 'next/server'
import { getAnalyticsSummary } from '@/lib/analytics'
import { getShopSetting, setShopSetting } from '@/lib/db'

export async function GET(req: NextRequest) {
  const range = req.nextUrl.searchParams.get('range') || '7d'
  const summary = getAnalyticsSummary(range)
  return NextResponse.json({
    summary,
    config: {
      gaId: getShopSetting('ga4_measurement_id') ?? '',
      pixelId: getShopSetting('meta_pixel_id') ?? '',
    },
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (typeof body.gaId === 'string') setShopSetting('ga4_measurement_id', body.gaId.trim())
  if (typeof body.pixelId === 'string') setShopSetting('meta_pixel_id', body.pixelId.trim())
  return NextResponse.json({ ok: true })
}
