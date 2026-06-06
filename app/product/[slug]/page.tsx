import { notFound } from 'next/navigation'
import { getProductBySlug, getRelatedProducts } from '@/lib/products'
import { getReviewsForProduct, getShopStats } from '@/lib/reviews'
import ProductDetailClient from '@/components/ProductDetailClient'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) notFound()

  const [reviews, stats, related] = await Promise.all([
    getReviewsForProduct(product.id),
    getShopStats(),
    getRelatedProducts(product.id, product.category, 6),
  ])

  return (
    <ProductDetailClient
      product={product}
      reviews={reviews}
      shopStats={stats}
      relatedProducts={related}
    />
  )
}
