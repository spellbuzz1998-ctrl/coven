import { NextRequest, NextResponse } from 'next/server'
import { createProduct, type Product } from '@/lib/products'
import { validateProductInput } from '@/lib/validateProduct'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const { ok, error, data } = validateProductInput(body, false)
    if (!ok || !data) {
      return NextResponse.json({ error: error ?? 'Invalid product' }, { status: 400 })
    }

    const product = createProduct(data as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>)
    return NextResponse.json({ product })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[admin/products POST]', message)
    // A duplicate slug is the common case here, so name it explicitly.
    if (message.includes('UNIQUE') && message.includes('slug')) {
      return NextResponse.json({ error: 'A product with that slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'The product could not be saved' }, { status: 500 })
  }
}
