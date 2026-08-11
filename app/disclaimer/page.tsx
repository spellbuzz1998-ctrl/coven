import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getDb } from '@/lib/db'
import PolicyDoc from '@/components/PolicyDoc'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Disclaimer — ThirteenCoven' }

export default function DisclaimerPage() {
  const override = (getDb().prepare('SELECT value FROM shop_settings WHERE key = ?').get('page_disclaimer') as { value: string } | undefined)?.value
  if (override && override.trim()) {
    return <PolicyDoc slug="disclaimer" title="Disclaimer" content={override} />
  }
  return (
    <div style={{ backgroundColor: '#f5f0e8', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 text-sm font-medium" style={{ color: '#1a1040' }}>
          <ArrowLeft size={16} /> Back to shop
        </Link>

        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
          Disclaimer
        </h1>
        <p className="text-xs mb-2" style={{ color: '#9ca3af' }}>Last Updated: June 10, 2026</p>
        <p className="text-sm font-semibold mb-8" style={{ color: '#1a1040' }}>PLEASE READ CAREFULLY BEFORE PURCHASING ANY SERVICE.</p>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: '#374151' }}>
          <Item n="1" title="Entertainment & Spiritual Purposes Only.">
            All services offered on ThirteenCoven.com — including spell casting, ritual work, tarot readings, and spiritual consultations — are provided for <strong>entertainment and spiritual enrichment purposes only</strong>, in accordance with New York law. Nothing on this Site claims a scientifically verifiable effect.
          </Item>

          <Item n="2" title="No Guaranteed Outcomes.">
            We do not and cannot guarantee any specific result from any service. Spiritual work outcomes vary and depend on factors beyond anyone&apos;s control. Anything you read on this Site describing potential outcomes reflects intention, tradition, or individual experience — not a promise.
          </Item>

          <Item n="3" title="Not Medical, Mental Health, Legal, or Financial Advice.">
            Nothing on this Site is a substitute for advice, diagnosis, or treatment from a licensed physician, mental health professional, attorney, or financial advisor. Never disregard or delay professional advice because of something you read or purchased here. If you are experiencing a medical or mental health emergency, call 911 or your local emergency number.
          </Item>

          <Item n="4" title="You Must Be 18 or Older.">
            Services are available only to adults aged 18 and over. We verify age using the date of birth you provide at checkout.
          </Item>

          <Item n="5" title="Personal Responsibility.">
            You retain full free will and are solely responsible for your own choices and actions. By purchasing, you accept all responsibility for decisions you make before, during, or after any service.
          </Item>

          <Item n="6" title="Testimonials.">
            Testimonials on this Site reflect individual experiences and are not a guarantee or prediction of your results. Results are not typical and are not promised.
          </Item>

          <Item n="7" title="No Fear-Based Selling.">
            We will never tell you that you, your loved ones, or your property are cursed, jinxed, in danger, or under spiritual attack in order to sell you anything. We will never ask you to pay escalating sums to &ldquo;remove&rdquo; a curse, nor ask you to hand over money, valuables, or objects as part of any ritual. The only amount you will ever pay is the published price of the service you choose. If anyone tells you otherwise in our name, it is not us.
          </Item>

          <Item n="8" title="Assumption of Risk & Release.">
            By purchasing any service, you knowingly and voluntarily accept these terms and release ThirteenCoven.com and its owner from any liability arising from your use of the services, to the maximum extent permitted by law.
          </Item>

          <div className="rounded-2xl p-5 mt-6" style={{ backgroundColor: '#2d1b6b' }}>
            <p className="text-sm font-semibold text-white leading-relaxed">
              By placing an order, you confirm that you have read, understood, and agree to this Disclaimer, and that no statement by us has caused you fear or pressured your decision to purchase.
            </p>
          </div>
        </div>

        <PolicyFooter current="disclaimer" />
      </div>
    </div>
  )
}

function Item({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5" style={{ backgroundColor: '#1a1040' }}>{n}</span>
      <div>
        <strong style={{ color: '#1a1040' }}>{title}</strong>{' '}
        {children}
      </div>
    </div>
  )
}

function PolicyFooter({ current }: { current: string }) {
  const links = [
    { href: '/terms', label: 'Terms & Conditions' },
    { href: '/disclaimer', label: 'Disclaimer' },
    { href: '/refund-policy', label: 'Refund Policy' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
  ]
  return (
    <div className="mt-12 pt-6 border-t flex flex-wrap gap-4 text-xs" style={{ borderColor: '#e5e7eb' }}>
      {links.map(l => (
        <Link key={l.href} href={l.href} className="hover:underline"
          style={{ color: l.href === `/${current}` ? '#1a1040' : '#9ca3af', fontWeight: l.href === `/${current}` ? 600 : 400 }}>
          {l.label}
        </Link>
      ))}
    </div>
  )
}
