import { NextRequest, NextResponse } from 'next/server'
import { createProduct } from '@/lib/products'

export async function POST(req: NextRequest) {
  const data = await req.json()
  const product = createProduct(data)
  return NextResponse.json({ product })
}
