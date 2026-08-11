import Image from 'next/image'
import Link from 'next/link'
import type { CommunityPost } from '@/lib/community'
import type { Article } from '@/lib/articles'
import type { SocialLinks } from '@/lib/social'
import SocialIcons from '@/components/SocialIcons'

interface Props {
  posts: CommunityPost[]
  articles: Article[]
  socialLinks: SocialLinks
}

const PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
}

export default function CommunityFeed({ posts, articles, socialLinks }: Props) {
  const hasContent = posts.length > 0 || articles.length > 0

  return (
    <div className="space-y-10">
      {/* Intro */}
      <div className="max-w-2xl">
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
          🌙 Join our community
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
          Follow along for spell results, moon rituals, client testimonials, and behind-the-scenes of the practice.
        </p>
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-3 mt-4">
            <span className="text-sm font-semibold" style={{ color: '#1a1040' }}>Follow us:</span>
            <SocialIcons links={socialLinks} size={22} className="text-[#1a1040]" />
          </div>
        )}
      </div>

      {/* Articles section */}
      {articles.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>Latest articles</h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map(article => (
              <Link key={article.id} href={`/community/${article.slug}`}
                className="group rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow hover-lift animate-fade-in-up">
                {article.coverImage && (
                  <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
                    <Image src={article.coverImage} alt={article.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 350px" />
                  </div>
                )}
                <div className="p-4">
                  <h4 className="text-sm font-bold line-clamp-2 group-hover:underline mb-1" style={{ color: '#1a1040' }}>
                    {article.title}
                  </h4>
                  {article.excerpt && (
                    <p className="text-xs line-clamp-2 mb-2" style={{ color: '#6b6670' }}>{article.excerpt}</p>
                  )}
                  <div className="flex items-center gap-2">
                    {article.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#f3f0ff', color: '#2d1b6b' }}>
                        {tag}
                      </span>
                    ))}
                    {article.publishedAt && (
                      <span className="text-[10px] ml-auto" style={{ color: '#9ca3af' }}>
                        {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Social embeds — grouped by platform, horizontal scroll */}
      {posts.length > 0 && (() => {
        const grouped: Record<string, CommunityPost[]> = {}
        posts.forEach(p => {
          if (!grouped[p.platform]) grouped[p.platform] = []
          grouped[p.platform].push(p)
        })
        return Object.entries(grouped).map(([platform, platformPosts]) => (
          <div key={platform}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
              {PLATFORM_LABEL[platform]}
            </h3>
            <div
              className="flex gap-3 overflow-x-auto pb-2"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              {platformPosts.map(post => (
                <div
                  key={post.id}
                  className="shrink-0 rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100"
                  style={{ width: 'calc(80vw - 16px)', maxWidth: 300 }}
                >
                  <div
                    className="relative w-full bg-black"
                    style={{ aspectRatio: platform === 'youtube' ? '16 / 9' : '1 / 1' }}
                  >
                    <iframe
                      src={post.embedUrl}
                      className="absolute inset-0 w-full h-full"
                      style={{ border: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                      scrolling="no"
                      title={`${PLATFORM_LABEL[platform]} post`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      })()}

      {/* Empty state */}
      {!hasContent && (
        <div className="rounded-xl border border-dashed p-10 text-center" style={{ borderColor: '#d6cfc2', backgroundColor: '#faf7f1' }}>
          <p className="text-sm" style={{ color: '#6b6670' }}>
            Fresh content is on the way — follow us on social to catch it first. 🔮
          </p>
        </div>
      )}
    </div>
  )
}
