import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductBySlug, getRelatedProducts } from '@/lib/products'
import { getReviewsForProduct, getShopStats } from '@/lib/reviews'
import { getActiveSale } from '@/lib/db'
import ProductDetailClient from '@/components/ProductDetailClient'

// Without this every product page inherited the same site-wide title and
// description, so search engines saw dozens of duplicate listings.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = getProductBySlug(slug)
  // The root layout's title template appends the shop name.
  if (!product) return { title: 'Product not found' }

  const description = (product.description || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 155)

  return {
    title: product.title,
    description: description || `${product.title} — spell casting and spiritual services by TheThirteenCoven.`,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.title,
      description,
      type: 'website',
      images: product.images.length > 0 ? [{ url: product.images[0] }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) notFound()

  const [reviews, stats, related] = await Promise.all([
    getReviewsForProduct(product.id),
    getShopStats(),
    getRelatedProducts(product.id, product.category, 6),
  ])

  const { saleDiscount, saleEndDate } = getActiveSale()

  return (
    <ProductDetailClient
      product={product}
      reviews={reviews}
      shopStats={stats}
      relatedProducts={related}
      saleEndDate={saleEndDate ?? undefined}
      saleDiscount={saleDiscount ?? undefined}
    />
  )
}
