import { NextRequest, NextResponse } from 'next/server'
import { updateProduct, deleteProduct, getProductById } from '@/lib/products'
import { validateProductInput } from '@/lib/validateProduct'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!getProductById(id)) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => null)
    const { ok, error, data } = validateProductInput(body, true)
    if (!ok || !data) {
      return NextResponse.json({ error: error ?? 'Invalid product' }, { status: 400 })
    }

    const product = updateProduct(id, data)
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json({ product })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[admin/products PATCH]', message)
    if (message.includes('UNIQUE') && message.includes('slug')) {
      return NextResponse.json({ error: 'A product with that slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'The product could not be saved' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!getProductById(id)) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    deleteProduct(id)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('[admin/products DELETE]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'The product could not be deleted' }, { status: 500 })
  }
}
