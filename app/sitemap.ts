import type { MetadataRoute } from 'next'
import { getAllProducts } from '@/lib/products'
import { getPublishedArticles } from '@/lib/articles'
import { PAGE_SLUGS } from '@/lib/pageContent'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    ...PAGE_SLUGS.map(slug => ({
      url: `${siteUrl}/${slug}`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
  ]

  let productRoutes: MetadataRoute.Sitemap = []
  let articleRoutes: MetadataRoute.Sitemap = []

  // A database hiccup shouldn't make the whole sitemap fail to build.
  try {
    productRoutes = getAllProducts().map(p => ({
      url: `${siteUrl}/product/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    productRoutes = []
  }

  try {
    articleRoutes = getPublishedArticles(200).map(a => ({
      url: `${siteUrl}/community/${a.slug}`,
      lastModified: a.updatedAt ? new Date(a.updatedAt) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch {
    articleRoutes = []
  }

  return [...staticRoutes, ...productRoutes, ...articleRoutes]
}
