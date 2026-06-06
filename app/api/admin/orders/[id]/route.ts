import { NextRequest, NextResponse } from 'next/server'
import { updateOrderStatus } from '@/lib/orders'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status } = await req.json()
  updateOrderStatus(id, status)
  return NextResponse.json({ ok: true })
}
