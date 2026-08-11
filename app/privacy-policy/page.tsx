import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getDb } from '@/lib/db'
import PolicyDoc from '@/components/PolicyDoc'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Privacy Policy — ThirteenCoven' }

export default function PrivacyPolicyPage() {
  const override = (getDb().prepare('SELECT value FROM shop_settings WHERE key = ?').get('page_privacy-policy') as { value: string } | undefined)?.value
  if (override && override.trim()) {
    return <PolicyDoc slug="privacy-policy" title="Privacy Policy" content={override} />
  }
  return (
    <div style={{ backgroundColor: '#f5f0e8', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 text-sm font-medium" style={{ color: '#1a1040' }}>
          <ArrowLeft size={16} /> Back to shop
        </Link>

        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
          Privacy Policy
        </h1>
        <p className="text-xs mb-8" style={{ color: '#9ca3af' }}>Last Updated: June 10, 2026</p>

        <p className="text-sm leading-relaxed mb-8" style={{ color: '#374151' }}>
          This Privacy Policy explains how ThirteenCoven.com (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;) collects, uses, and protects your personal information when you visit the Site or purchase our services.
        </p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: '#374151' }}>
          <Section title="1. Information We Collect">
            <p className="mb-3">When you place an order or contact us, we collect:</p>
            <ul className="space-y-2">
              {[
                ['Full name', 'to identify your order and personalize your spiritual work.'],
                ['Date of birth', 'to verify that you are 18 or older (required to purchase) and to personalize your spiritual work where relevant to the tradition practiced.'],
                ['Email address', 'to communicate with you about your order, deliver confirmations and written results, and respond to your questions.'],
                ['Order details', 'the services you purchase and any information you voluntarily share with us about your situation or intentions.'],
                ['Payment information', 'payments are processed by our third-party payment processor (Stripe). We never see or store your full card number; the processor handles it under its own privacy policy.'],
                ['Basic technical data', 'like most websites, our hosting and analytics may automatically log IP address, browser type, and pages visited, used only to operate and improve the Site.'],
              ].map(([label, desc]) => (
                <li key={label} className="flex gap-2">
                  <span className="text-yellow-600 shrink-0 mt-0.5">✦</span>
                  <span><strong style={{ color: '#1a1040' }}>{label}</strong> — {desc}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <p className="mb-3">
              We use your information only to: (a) verify your eligibility (18+); (b) perform and deliver the services you purchase; (c) communicate with you about your orders; (d) respond to support requests; (e) maintain records of your acceptance of our Terms, Disclaimer, and policies; and (f) comply with legal obligations.
            </p>
            <div className="rounded-xl px-4 py-3 font-semibold" style={{ backgroundColor: '#2d1b6b', color: 'white' }}>
              We do not sell, rent, or trade your personal information to anyone.
            </div>
          </Section>

          <Section title="3. Marketing Emails">
            <p>
              We will only send you marketing or newsletter emails if you separately opt in. Every marketing email includes an unsubscribe link, and you may opt out at any time without affecting your orders.
            </p>
          </Section>

          <Section title="4. How We Share Information">
            <p>
              We share your information only with: (a) our payment processor, to complete your transaction; (b) our website hosting and email providers, solely to operate the Site; and (c) law enforcement or courts, if required by valid legal process. We do not share the details of your spiritual requests with anyone.
            </p>
          </Section>

          <Section title="5. Confidentiality of Your Requests">
            <p>
              We understand the personal and sensitive nature of spiritual work. The details you share about your situation are treated as strictly confidential and are accessed only as needed to perform your service.
            </p>
          </Section>

          <Section title="6. Data Security">
            <p>
              We take reasonable administrative and technical measures to protect your personal information, consistent with the New York SHIELD Act, including secure (HTTPS) connections, restricted access to customer data, and reputable third-party providers. No method of transmission or storage is 100% secure, but we work to protect your data using industry-standard practices. In the unlikely event of a data breach affecting your personal information, we will notify you as required by New York law.
            </p>
          </Section>

          <Section title="7. Data Retention">
            <p>
              We keep order records (name, date of birth, email, order details, and your acceptance of our terms) for as long as reasonably necessary for business, tax, and legal purposes. You may request deletion at any time (see Section 9), subject to records we are legally required to keep.
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>
              The Site may use essential cookies needed for it to function (such as keeping your cart or session active) and basic analytics cookies to understand site traffic. You can disable cookies in your browser settings; essential features may stop working if you do.
            </p>
          </Section>

          <Section title="9. Your Rights">
            <p>
              You may at any time email us at <a href="mailto:spellbuzz1998@gmail.com" style={{ color: '#c9a84c' }}>spellbuzz1998@gmail.com</a> to: (a) request a copy of the personal information we hold about you; (b) correct inaccurate information; (c) request deletion of your information; or (d) opt out of marketing emails. If you are a resident of a jurisdiction with specific privacy rights (such as California or the European Union), we will honor the rights granted to you under applicable law.
            </p>
          </Section>

          <Section title="10. Age Restriction">
            <p>
              The Site and our services are intended only for adults aged 18 and over. We do not knowingly collect information from anyone under 18. If we learn we have collected information from a minor, we will delete it and cancel any associated order.
            </p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time by posting the revised version here with a new &ldquo;Last Updated&rdquo; date.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>For any privacy questions or requests:</p>
            <p className="mt-1">ThirteenCoven.com</p>
            <p>Email: <a href="mailto:spellbuzz1998@gmail.com" style={{ color: '#c9a84c' }}>spellbuzz1998@gmail.com</a></p>
          </Section>
        </div>

        <PolicyFooter current="privacy-policy" />
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-bold mb-3" style={{ color: '#1a1040' }}>{title}</h2>
      {children}
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
