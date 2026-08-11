import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getDb } from '@/lib/db'
import PolicyDoc from '@/components/PolicyDoc'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Refund Policy — ThirteenCoven' }

export default function RefundPolicyPage() {
  const override = (getDb().prepare('SELECT value FROM shop_settings WHERE key = ?').get('page_refund-policy') as { value: string } | undefined)?.value
  if (override && override.trim()) {
    return <PolicyDoc slug="refund-policy" title="Refund Policy" content={override} />
  }
  return (
    <div style={{ backgroundColor: '#f5f0e8', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 text-sm font-medium" style={{ color: '#1a1040' }}>
          <ArrowLeft size={16} /> Back to shop
        </Link>

        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
          Refund Policy
        </h1>
        <p className="text-xs mb-8" style={{ color: '#9ca3af' }}>Last Updated: June 10, 2026</p>

        <p className="text-sm leading-relaxed mb-8" style={{ color: '#374151' }}>
          Because every service on ThirteenCoven.com is personalized spiritual work performed specifically for you, the following policy applies:
        </p>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: '#374151' }}>
          <RefundItem
            n="1"
            title="Before work begins"
            highlight="green"
            badge="Full refund eligible"
          >
            You may cancel for a <strong>full refund</strong> any time before we begin work on your order. Contact{' '}
            <a href="mailto:spellbuzz1998@gmail.com" style={{ color: '#c9a84c' }}>spellbuzz1998@gmail.com</a>{' '}
            with your order number.
          </RefundItem>

          <RefundItem
            n="2"
            title="After work has begun or is complete"
            highlight="red"
            badge="Non-refundable"
          >
            Once your ritual, casting, or reading has been started or performed, the labor has been rendered and the order is <strong>non-refundable</strong>. What you purchase is the performance of the spiritual work as described in the listing — not a guaranteed outcome — and that work will have been completed.
          </RefundItem>

          <RefundItem
            n="3"
            title="Non-delivery"
            highlight="green"
            badge="Full refund eligible"
          >
            If we fail to perform your service within 14 days of the stated timeframe and cannot agree on a new date with you, you are entitled to a <strong>full refund</strong>. &ldquo;Performance&rdquo; means we carried out the ritual, casting, or reading as described in the listing; it does <strong>not</strong> mean any particular outcome occurred, and a refund will not be issued on the basis that a desired result did not materialize.
          </RefundItem>

          <RefundItem
            n="4"
            title="Our discretion"
            highlight="neutral"
            badge="Case by case"
          >
            We may, at our sole discretion, offer a partial refund, a redo, or store credit in situations not covered above. Such gestures are goodwill and do not create an ongoing obligation.
          </RefundItem>

          <RefundItem
            n="5"
            title="Chargebacks"
            highlight="red"
            badge="Please contact us first"
          >
            Please contact us before initiating a chargeback — we resolve almost all issues directly. Because our services are entertainment and spiritual services with no guaranteed outcome, a dissatisfying or unwished-for result is not grounds for a refund or chargeback once the work has been performed. Chargebacks filed on completed and documented work may be disputed with full evidence of service delivery, our communications with you, and your recorded acceptance of these terms at checkout.
          </RefundItem>

          <RefundItem
            n="6"
            title="How to request a refund"
            highlight="neutral"
            badge="5–10 business days"
          >
            Email <a href="mailto:spellbuzz1998@gmail.com" style={{ color: '#c9a84c' }}>spellbuzz1998@gmail.com</a> with your order number and the reason for your request. Approved refunds are processed to the original payment method within 5–10 business days.
          </RefundItem>
        </div>

        <PolicyFooter current="refund-policy" />
      </div>
    </div>
  )
}

function RefundItem({ n, title, highlight, badge, children }: {
  n: string; title: string; highlight: 'green' | 'red' | 'neutral'; badge: string; children: React.ReactNode
}) {
  const badgeColors = {
    green: { bg: '#dcfce7', color: '#166534' },
    red: { bg: '#fee2e2', color: '#991b1b' },
    neutral: { bg: '#f3f4f6', color: '#374151' },
  }
  const bc = badgeColors[highlight]
  return (
    <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e7eb' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: '#1a1040' }}>{n}</span>
          <h3 className="font-semibold text-sm" style={{ color: '#1a1040' }}>{title}</h3>
        </div>
        <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: bc.bg, color: bc.color }}>{badge}</span>
      </div>
      <p>{children}</p>
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
