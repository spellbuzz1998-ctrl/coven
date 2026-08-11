import { NextResponse } from 'next/server'
import { getShopSetting } from '@/lib/db'

export async function GET() {
  try {
    const raw = getShopSetting('video_testimonials')
    if (!raw) return NextResponse.json([])
    // Malformed JSON here used to 500 the request and break the homepage strip.
    const parsed = JSON.parse(raw)
    return NextResponse.json(Array.isArray(parsed) ? parsed : [])
  } catch (err: unknown) {
    console.error('[testimonials]', err instanceof Error ? err.message : String(err))
    return NextResponse.json([])
  }
}
