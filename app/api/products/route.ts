import { NextRequest, NextResponse } from 'next/server'
import { getAllProducts, getCategories, searchProducts } from '@/lib/products'
import { getActiveSale } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')?.slice(0, 120) || undefined
    const query = searchParams.get('q')?.trim().slice(0, 200) || undefined

    const products = query ? searchProducts(query) : getAllProducts(category)
    const categories = getCategories()
    const { saleDiscount, saleEndDate } = getActiveSale()

    return NextResponse.json({ products, categories, saleEndDate, saleDiscount })
  } catch (err: unknown) {
    console.error('[products]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Could not load products' }, { status: 500 })
  }
}
