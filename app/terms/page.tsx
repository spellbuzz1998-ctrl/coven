import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getDb } from '@/lib/db'
import PolicyDoc from '@/components/PolicyDoc'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Terms & Conditions — ThirteenCoven' }

export default function TermsPage() {
  const override = (getDb().prepare('SELECT value FROM shop_settings WHERE key = ?').get('page_terms') as { value: string } | undefined)?.value
  if (override && override.trim()) {
    return <PolicyDoc slug="terms" title="Terms & Conditions" content={override} />
  }
  return (
    <div style={{ backgroundColor: '#f5f0e8', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 text-sm font-medium" style={{ color: '#1a1040' }}>
          <ArrowLeft size={16} /> Back to shop
        </Link>

        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
          Terms &amp; Conditions
        </h1>
        <p className="text-xs mb-8" style={{ color: '#9ca3af' }}>Last Updated: June 10, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: '#374151' }}>
          <p>
            Welcome to ThirteenCoven.com (&ldquo;the Site,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;). By accessing the Site or purchasing any service, you (&ldquo;you,&rdquo; &ldquo;Client&rdquo;) agree to be bound by these Terms &amp; Conditions, our Disclaimer, our Refund Policy, and our Privacy Policy. If you do not agree, do not use the Site or purchase any service.
          </p>

          <Section title="1. Nature of Services">
            <p>
              We offer spiritual, metaphysical, and energy-based services, including but not limited to spell casting, ritual work, tarot readings, and related spiritual consultations (&ldquo;Services&rdquo;).
            </p>
            <p className="mt-3 font-semibold uppercase text-xs tracking-wide" style={{ color: '#1a1040' }}>
              ALL SERVICES ARE PROVIDED FOR ENTERTAINMENT AND SPIRITUAL ENRICHMENT PURPOSES ONLY.
            </p>
            <p className="mt-2">
              Our Services are rooted in spiritual and cultural traditions. They are offered as a form of spiritual support, personal exploration, and entertainment, and are not represented as having any scientifically verifiable effect.
            </p>
          </Section>

          <Section title="2. No Guarantee of Results">
            <p>
              Spiritual work is, by its nature, not guaranteed. We make <strong>no representation, warranty, or guarantee</strong> of any specific outcome, result, timeline, or effect from any Service. Any outcome described in Service listings, testimonials, or communications reflects intention or individual experience only and must not be understood as a promise of results. You purchase Services with full understanding and acceptance of this.
            </p>
          </Section>

          <Section title="3. Not Professional Advice">
            <p className="mb-3">
              Our Services are <strong>not</strong> a substitute for, and do not constitute, medical, psychiatric, psychological, legal, financial, or any other licensed professional advice, diagnosis, or treatment. We are not licensed physicians, therapists, attorneys, or financial advisors.
            </p>
            <ul className="space-y-2 pl-4" style={{ listStyle: 'disc' }}>
              <li>If you have a medical or mental health condition, consult a licensed healthcare provider. <strong>Never delay, avoid, or discontinue medical or psychological treatment because of anything related to our Services.</strong></li>
              <li>For legal matters, consult a licensed attorney. For financial matters, consult a licensed financial professional.</li>
              <li>If you are in crisis or experiencing thoughts of harming yourself or others, contact emergency services (911 in the US) or a crisis line immediately. Our Services are not crisis support.</li>
            </ul>
          </Section>

          <Section title="4. Eligibility">
            <p>
              You must be at least 18 years of age to purchase any Service. By purchasing, you represent that you are 18 or older and have the legal capacity to enter this agreement. We collect your date of birth to verify eligibility and to personalize your spiritual work.
            </p>
          </Section>

          <Section title="5. Client Responsibility & Free Will">
            <p>
              You acknowledge that you retain complete free will and sole responsibility for your decisions and actions. Any decision you make before, during, or after receiving a Service is yours alone. We are not responsible for actions you take or do not take based on our Services or any communication from us.
            </p>
          </Section>

          <Section title="6. Honest Practice Commitment & Your Acknowledgments">
            <p className="mb-3">
              We hold ourselves to an honest-practice standard. <strong>We will never:</strong> (a) tell you that you, your family, or your property are cursed, in danger, or under attack in order to sell you a service or a &ldquo;fix&rdquo;; (b) demand escalating, large, or open-ended payments to &ldquo;remove,&rdquo; &ldquo;cleanse,&rdquo; or &ldquo;reverse&rdquo; negative energy, curses, or bad luck; (c) use fear, urgency, or pressure of any kind to induce a purchase; (d) ask you to buy, hand over, or entrust to us any object, jewelry, cash, gold, or other valuable as part of a ritual; or (e) ask you to take out a loan, drain savings, or make any purchase beyond the published price of the service you selected.
            </p>
            <p>
              You acknowledge and agree that: (i) the only money you will ever pay us is the published, fixed price of the specific service you choose at checkout; (ii) we have made no promise that any service will produce a specific result; (iii) no statement by us has caused you to fear harm or has pressured you into your purchase; and (iv) if anyone ever contacts you claiming to be from this Site and asks for money, gifts, or valuables outside the normal checkout, it is not us — do not pay, and report it to us at <a href="mailto:spellbuzz1998@gmail.com" style={{ color: '#c9a84c' }}>spellbuzz1998@gmail.com</a>.
            </p>
            <p className="mt-3">
              If you ever feel pressured, stop purchasing immediately and contact us at <a href="mailto:spellbuzz1998@gmail.com" style={{ color: '#c9a84c' }}>spellbuzz1998@gmail.com</a>.
            </p>
          </Section>

          <Section title="7. Payments">
            <p>
              All prices are listed in US Dollars. Payment is due in full at the time of purchase through the payment methods offered on the Site. You agree to provide accurate billing information. We reserve the right to refuse or cancel any order at our discretion, with a full refund of any amount paid for the cancelled order.
            </p>
          </Section>

          <Section title="8. Delivery of Services">
            <p>
              Services are performed within the timeframe stated in the Service listing. Because Services are spiritual in nature, &ldquo;delivery&rdquo; means the performance of the ritual, casting, or reading as described — not the achievement of any outcome. Where stated, you will receive confirmation, photos, or a written summary upon completion. Timeframes are estimates and may vary.
            </p>
          </Section>

          <Section title="9. Refunds">
            <p>
              Refunds are governed by our <Link href="/refund-policy" style={{ color: '#c9a84c' }}>Refund Policy</Link> (incorporated into these Terms). In summary: because Services are personalized and performed labor, completed Services are non-refundable; orders cancelled before work begins are refundable. See the full Refund Policy for details.
            </p>
          </Section>

          <Section title="10. Confidentiality">
            <p>
              We treat the details you share with us as confidential and will not disclose them except as required by law or as described in our <Link href="/privacy-policy" style={{ color: '#c9a84c' }}>Privacy Policy</Link>. You agree, in turn, not to record sessions without consent or to publish our private communications.
            </p>
          </Section>

          <Section title="11. Intellectual Property">
            <p>
              All content on the Site — text, ritual descriptions, images, branding, and written readings — is our property or licensed to us and is protected by copyright. You may not copy, resell, or redistribute it. Written readings and reports delivered to you are for your personal use only.
            </p>
          </Section>

          <Section title="12. Prohibited Uses">
            <p>
              You agree not to use the Site or Services: (a) for any unlawful purpose; (b) to request work intended to harass, threaten, stalk, or harm any specific person; (c) to impersonate another person; (d) to scrape, copy, or reverse-engineer the Site; or (e) in violation of any applicable law. We may refuse or cancel any request at our sole discretion.
            </p>
          </Section>

          <Section title="13. Limitation of Liability">
            <p className="uppercase text-xs font-semibold leading-relaxed" style={{ color: '#1a1040' }}>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, THIRTEENCOVEN.COM AND ITS OWNER, EMPLOYEES, AND CONTRACTORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, DATA, OPPORTUNITY, RELATIONSHIP, HEALTH, OR EMOTIONAL WELLBEING, ARISING FROM OR RELATED TO THE SITE OR SERVICES — EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. IN ALL CASES, OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SPECIFIC SERVICE GIVING RISE TO THE CLAIM.
            </p>
            <p className="mt-3">
              Some jurisdictions do not allow certain limitations of liability; in such jurisdictions, our liability is limited to the greatest extent permitted by law.
            </p>
          </Section>

          <Section title="14. Indemnification">
            <p>
              You agree to indemnify and hold harmless ThirteenCoven.com and its owner from any claims, damages, or expenses (including reasonable attorneys&apos; fees) arising from your breach of these Terms or your misuse of the Site or Services.
            </p>
          </Section>

          <Section title="15. Dispute Resolution, Arbitration & Governing Law">
            <p className="mb-3">These Terms are governed by the laws of the State of New York, without regard to conflict-of-law principles.</p>
            <div className="space-y-3">
              <p><strong>(a) Informal resolution first.</strong> Before filing any claim, you agree to first contact us at <a href="mailto:spellbuzz1998@gmail.com" style={{ color: '#c9a84c' }}>spellbuzz1998@gmail.com</a> and attempt in good faith to resolve the dispute informally for 30 days.</p>
              <p><strong>(b) Binding arbitration.</strong> If the dispute is not resolved informally, you and we agree that <strong>any dispute, claim, or controversy arising out of or relating to the Site or Services shall be resolved by final and binding individual arbitration</strong> administered by the American Arbitration Association under its Consumer Arbitration Rules, rather than in court, except that either party may bring an individual claim in small claims court. The arbitration shall take place in New York County, New York, or via remote/video hearing.</p>
              <p><strong>(c) Class action waiver.</strong> You and we agree that each may bring claims against the other <strong>only in an individual capacity, and not as a plaintiff or class member in any purported class, collective, or representative proceeding.</strong> The arbitrator may not consolidate more than one person&apos;s claims.</p>
              <p><strong>(d) 30-day opt-out.</strong> You may opt out of this arbitration agreement by emailing <a href="mailto:spellbuzz1998@gmail.com" style={{ color: '#c9a84c' }}>spellbuzz1998@gmail.com</a> within 30 days of your first purchase, stating your name and that you opt out of arbitration. Opting out does not affect any other provision of these Terms.</p>
              <p><strong>(e) Court fallback.</strong> If the arbitration agreement is found unenforceable, any dispute shall be brought exclusively in the state or federal courts located in New York County, New York, and you consent to the jurisdiction of those courts.</p>
              <p><strong>(f) Time limit.</strong> To the extent permitted by law, any claim must be brought within one (1) year after it arises, or it is permanently barred.</p>
            </div>
          </Section>

          <Section title="16. Changes to These Terms">
            <p>
              We may update these Terms at any time by posting the revised version on this page with a new &ldquo;Last Updated&rdquo; date. Continued use of the Site after changes constitutes acceptance.
            </p>
          </Section>

          <Section title="17. Severability & Entire Agreement">
            <p>
              If any provision of these Terms is found unenforceable, the remaining provisions remain in full effect. These Terms, together with the Disclaimer, Refund Policy, and Privacy Policy, are the entire agreement between you and us.
            </p>
          </Section>

          <Section title="18. Contact">
            <p>ThirteenCoven.com</p>
            <p>Email: <a href="mailto:spellbuzz1998@gmail.com" style={{ color: '#c9a84c' }}>spellbuzz1998@gmail.com</a></p>
          </Section>
        </div>

        <PolicyFooter />
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

function PolicyFooter() {
  return (
    <div className="mt-12 pt-6 border-t flex flex-wrap gap-4 text-xs" style={{ borderColor: '#e5e7eb', color: '#9ca3af' }}>
      <Link href="/disclaimer" className="hover:underline">Disclaimer</Link>
      <Link href="/refund-policy" className="hover:underline">Refund Policy</Link>
      <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
      <Link href="/terms" className="hover:underline" style={{ color: '#1a1040', fontWeight: 600 }}>Terms &amp; Conditions</Link>
    </div>
  )
}
