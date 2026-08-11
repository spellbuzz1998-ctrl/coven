import { NextRequest, NextResponse } from 'next/server'
import { recordEvent, type EventType } from '@/lib/analytics'

// Public endpoint: the storefront posts first-party interaction events here.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const type = body?.type as EventType
    if (!type) return NextResponse.json({ error: 'type required' }, { status: 400 })

    const ok = recordEvent({
      type,
      path: typeof body.path === 'string' ? body.path.slice(0, 512) : undefined,
      productSlug: typeof body.productSlug === 'string' ? body.productSlug.slice(0, 200) : undefined,
      productTitle: typeof body.productTitle === 'string' ? body.productTitle.slice(0, 300) : undefined,
      value: typeof body.value === 'number' ? body.value : undefined,
      visitorId: typeof body.visitorId === 'string' ? body.visitorId.slice(0, 64) : undefined,
      referrer: typeof body.referrer === 'string' ? body.referrer.slice(0, 512) : undefined,
    })

    if (!ok) return NextResponse.json({ error: 'invalid type' }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
}
