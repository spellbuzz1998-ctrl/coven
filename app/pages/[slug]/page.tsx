import { getDb } from '@/lib/db'
import { notFound } from 'next/navigation'
import PolicyDoc from '@/components/PolicyDoc'
import { PAGE_TITLES, PAGE_DEFAULTS } from '@/lib/pageContent'

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!PAGE_TITLES[slug]) notFound()

  const db = getDb()
  const row = db.prepare('SELECT value FROM shop_settings WHERE key = ?').get(`page_${slug}`) as { value: string } | undefined
  const content = row?.value?.trim() ? row.value : (PAGE_DEFAULTS[slug] ?? '')

  return <PolicyDoc slug={slug} title={PAGE_TITLES[slug]} content={content} />
}
