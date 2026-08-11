import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const POLICY_LINKS = [
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/disclaimer', label: 'Disclaimer' },
  { href: '/refund-policy', label: 'Refund Policy' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
]

// Renders admin-managed plaintext content. Lines beginning with "## " become
// headings; blank lines separate paragraphs.
export default function PolicyDoc({
  slug,
  title,
  content,
}: {
  slug: string
  title: string
  content: string
}) {
  const blocks = content.split('\n')

  return (
    <div style={{ backgroundColor: '#f5f0e8', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 text-sm font-medium" style={{ color: '#1a1040' }}>
          <ArrowLeft size={16} /> Back to shop
        </Link>

        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
          {title}
        </h1>

        <div className="text-sm leading-relaxed" style={{ color: '#374151' }}>
          {blocks.map((line, i) => {
            const trimmed = line.trim()
            if (trimmed === '') return <div key={i} className="h-3" />
            if (trimmed.startsWith('## ')) {
              return (
                <h2 key={i} className="text-base font-bold mt-6 mb-2" style={{ color: '#1a1040' }}>
                  {trimmed.slice(3)}
                </h2>
              )
            }
            return <p key={i} className="mb-3">{line}</p>
          })}
        </div>

        <div className="mt-12 pt-6 border-t flex flex-wrap gap-4 text-xs" style={{ borderColor: '#e5e7eb' }}>
          {POLICY_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:underline"
              style={{ color: l.href === `/${slug}` ? '#1a1040' : '#9ca3af', fontWeight: l.href === `/${slug}` ? 600 : 400 }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
