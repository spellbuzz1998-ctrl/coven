import { NextRequest, NextResponse } from 'next/server'
import { getAllProducts, getCategories, searchProducts } from '@/lib/products'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? undefined
  const query = searchParams.get('q') ?? undefined

  const products = query ? searchProducts(query) : getAllProducts(category)
  const categories = getCategories()

  return NextResponse.json({ products, categories })
}
