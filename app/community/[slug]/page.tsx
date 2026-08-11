import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getArticleBySlug, getPublishedArticles } from '@/lib/articles'
import { getShopSetting } from '@/lib/db'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article || !article.isPublished) return { title: 'Not found' }

  const title = article.metaTitle || article.title
  const description = article.metaDescription || article.excerpt || article.title
  const shopName = getShopSetting('shop_name') || 'ThirteenCoven'

  return {
    title: `${title} — ${shopName}`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.publishedAt ?? undefined,
      authors: [shopName],
      ...(article.coverImage ? { images: [{ url: article.coverImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: article.coverImage ? 'summary_large_image' : 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `/community/${slug}`,
    },
  }
}

function renderBody(body: string) {
  return body.split('\n\n').map((block, i) => {
    const trimmed = block.trim()
    if (!trimmed) return null

    if (trimmed.startsWith('## ')) {
      return <h2 key={i} className="text-xl font-bold mt-8 mb-3" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>{trimmed.slice(3)}</h2>
    }
    if (trimmed.startsWith('### ')) {
      return <h3 key={i} className="text-lg font-bold mt-6 mb-2" style={{ color: '#1a1040' }}>{trimmed.slice(4)}</h3>
    }

    const formatted = trimmed
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')

    return <p key={i} className="mb-4 leading-relaxed" style={{ color: '#374151' }} dangerouslySetInnerHTML={{ __html: formatted }} />
  })
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article || !article.isPublished) notFound()

  const shopName = getShopSetting('shop_name') || 'ThirteenCoven'
  const relatedArticles = getPublishedArticles(4).filter(a => a.id !== article.id).slice(0, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt,
    ...(article.coverImage ? { image: article.coverImage } : {}),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { '@type': 'Organization', name: shopName },
    publisher: { '@type': 'Organization', name: shopName },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs mb-6" style={{ color: '#6b6670' }}>
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <Link href="/?tab=community" className="hover:underline">Community</Link>
          <span>/</span>
          <span style={{ color: '#1a1040' }}>{article.title}</span>
        </nav>

        {/* Cover image */}
        {article.coverImage && (
          <div className="relative w-full rounded-2xl overflow-hidden mb-6" style={{ aspectRatio: '16 / 9' }}>
            <Image src={article.coverImage} alt={article.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" priority />
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-3" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: '#6b6670' }}>
            <span>By {shopName}</span>
            {article.publishedAt && (
              <>
                <span>·</span>
                <time dateTime={article.publishedAt}>
                  {new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
              </>
            )}
            {article.tags.length > 0 && (
              <>
                <span>·</span>
                <div className="flex gap-1.5">
                  {article.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: '#f3f0ff', color: '#2d1b6b' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Body */}
        <div className="text-sm sm:text-base">
          {renderBody(article.body)}
        </div>

        {/* CTA */}
        <div className="mt-10 p-6 rounded-2xl text-center" style={{ backgroundColor: '#2d1b6b' }}>
          <p className="text-white font-bold text-lg mb-2" style={{ fontFamily: 'Georgia, serif' }}>Ready to start your spiritual journey?</p>
          <p className="text-white/70 text-sm mb-4">Browse our services and find the ritual that speaks to you.</p>
          <Link href="/" className="inline-block px-6 py-2.5 rounded-full font-bold text-sm" style={{ backgroundColor: '#c9a84c', color: '#1a1040' }}>
            Browse shop
          </Link>
        </div>

        {/* Related articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>More from the community</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {relatedArticles.map(a => (
                <Link key={a.id} href={`/community/${a.slug}`} className="group rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  {a.coverImage && (
                    <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
                      <Image src={a.coverImage} alt={a.title} fill className="object-cover" sizes="300px" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-semibold line-clamp-2 group-hover:underline" style={{ color: '#1a1040' }}>{a.title}</p>
                    {a.excerpt && <p className="text-xs mt-1 line-clamp-2" style={{ color: '#6b6670' }}>{a.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </>
  )
}
