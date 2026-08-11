import { NextResponse } from 'next/server'
import { getShopSetting } from '@/lib/db'

// Public: the storefront reads which third-party tags to load (IDs only, no secrets).
export async function GET() {
  return NextResponse.json({
    gaId: getShopSetting('ga4_measurement_id') ?? '',
    pixelId: getShopSetting('meta_pixel_id') ?? '',
  })
}
