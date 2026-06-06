import { createProduct } from '../lib/products'
import { createReview } from '../lib/reviews'
import { getDb } from '../lib/db'
import * as fs from 'fs'
import * as path from 'path'

// Ensure data dir exists
const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

// Wipe existing seed data so re-runs are idempotent
const db = getDb()
db.exec('DELETE FROM reviews; DELETE FROM order_items; DELETE FROM orders; DELETE FROM products; DELETE FROM coupons;')

const products = [
  {
    slug: 'reconciliation-spell',
    title: 'Powerful Reconciliation Spell — Reunite With Your Ex',
    description: `Bring your person back with our most-requested reconciliation ritual. This working uses ancient candle magic, intention oil, and spirit invocation to remove blockages, open communication, and reignite the emotional connection between you and your ex-partner.\n\nAfter purchase, send your full name, date of birth, and your person's full name and DOB in the personalization field. Results typically begin within 3–21 days.\n\n✦ Includes ritual report sent to your email\n✦ One free follow-up reading included\n✦ 100% confidential`,
    price: 29.99,
    originalPrice: 49.99,
    category: 'Love Spells',
    images: ['/images/reconciliation-spell.jpg'],
    personalizationPrompt: 'Please provide: Your full name, your date of birth, your person\'s full name, your person\'s date of birth, and a brief description of your situation.',
    isDigital: true,
    isActive: true,
  },
  {
    slug: 'contact-me-spell',
    title: 'Contact Me Spell — Break The Silence & Make Them Reach Out',
    description: `Has someone gone silent on you? This spell works to remove mental and spiritual barriers that are keeping your person from reaching out. Within days, many clients receive a text, call, or unexpected message.\n\nThis ritual uses sympathetic magic, obsidian, and communication-drawing herbs to open the channel between you.\n\n✦ Personalized to your target's energy\n✦ Ritual photo proof sent via email\n✦ Follow-up check-in included`,
    price: 19.99,
    originalPrice: 34.99,
    category: 'Love Spells',
    images: ['/images/contact-me-spell.jpg'],
    personalizationPrompt: 'Your full name and DOB. Your person\'s full name and DOB. How long have they been silent? What was the last interaction?',
    isDigital: true,
    isActive: true,
  },
  {
    slug: 'make-him-miss-you-tantra',
    title: 'Make Him Miss You — Tantric Obsession Working',
    description: `Using ancient Tantric techniques, this ritual creates an energetic cord between you and your person that makes them unable to stop thinking about you. They will feel your energy, dream of you, and feel a magnetic pull to reach out.\n\n✦ 3-night ritual performed on your behalf\n✦ Includes affirmation recording\n✦ Results visible within 7–14 days`,
    price: 24.99,
    originalPrice: 44.99,
    category: 'Love Spells',
    images: ['/images/tantra-spell.jpg'],
    personalizationPrompt: 'Your full name, DOB, and photo (if available). His full name, DOB, and your relationship status.',
    isDigital: true,
    isActive: true,
  },
  {
    slug: 'relationship-energy-alignment',
    title: 'Personalized Relationship Energy Alignment Reading',
    description: `A deep-dive energy reading specifically for your relationship situation. I will tune into both of your energies and give you a detailed report on: the current state of his feelings, what is blocking the connection, what actions will shift the energy, and a timeline prediction.\n\n✦ Delivered within 24 hours\n✦ Minimum 2-page written report\n✦ Includes action steps`,
    price: 14.99,
    originalPrice: 24.99,
    category: 'Readings',
    images: ['/images/energy-reading.jpg'],
    personalizationPrompt: 'Your full name and DOB. His full name and DOB. Your specific question or situation (be as detailed as possible).',
    isDigital: true,
    isActive: true,
  },
  {
    slug: 'pet-protection-spell',
    title: 'Pet Protection Spell — Shield Your Animal Companion',
    description: `Infuse your beloved pet with a protective shield against illness, accidents, and negative energy. This gentle ritual uses white candle magic and protective herbs to create a spiritual barrier around your animal companion.\n\n✦ Works for dogs, cats, birds, and other animals\n✦ Ritual completed within 48 hours\n✦ Protective sigil emailed to you`,
    price: 15.99,
    originalPrice: 25.99,
    category: 'Protection',
    images: ['/images/pet-protection.jpg'],
    personalizationPrompt: 'Your pet\'s name, species/breed, age, and a photo if possible. Your full name and your address (city/state only).',
    isDigital: true,
    isActive: true,
  },
  {
    slug: 'same-hour-psychic-reading',
    title: 'Same-Hour Accurate Psychic Reading — Love, Career, Life',
    description: `Get clear, direct answers within the same hour of purchase. Ask anything — love, ex partners, career, money, family, life path. I channel spirit guides and use Tarot to deliver honest, detailed answers.\n\n✦ Delivered via email within 1 hour\n✦ Ask up to 3 questions\n✦ Photo-backed Tarot spread included`,
    price: 9.99,
    originalPrice: 19.99,
    category: 'Readings',
    images: ['/images/psychic-reading.jpg'],
    personalizationPrompt: 'Your full name and DOB. Your 1–3 questions. Include any relevant context (names, dates, situations).',
    isDigital: true,
    isActive: true,
  },
  {
    slug: 'fidelity-love-tarot-reading',
    title: 'Fidelity & Extreme Love Tarot Reading — Is He Faithful?',
    description: `Discover the truth about your partner's loyalty and the depth of their feelings. This specialized Tarot reading examines fidelity, hidden emotions, third-party interference, and the energetic truth of your connection.\n\n✦ 10-card spread + photo\n✦ Audio recording option available\n✦ Delivered within 24 hours`,
    price: 12.99,
    originalPrice: 22.99,
    category: 'Readings',
    images: ['/images/tarot-reading.jpg'],
    personalizationPrompt: 'Both full names and DOBs. Are you currently together or separated? Any specific concerns about fidelity? How long have you been together?',
    isDigital: true,
    isActive: true,
  },
  {
    slug: 'road-opener-money-spell',
    title: 'Road Opener & Money Attraction Spell — Unblock Your Abundance',
    description: `Remove financial blockages and open new pathways for money, opportunity, and success. This ritual combines Road Opener oil, green candle magic, and prosperity herbs to clear the energetic debris blocking your abundance.\n\n✦ Performed over 7 consecutive nights\n✦ Results typically within 2–4 weeks\n✦ Full ritual report with photos`,
    price: 34.99,
    originalPrice: 59.99,
    category: 'Money & Prosperity',
    images: ['/images/money-spell.jpg'],
    personalizationPrompt: 'Your full name, DOB, and your specific financial goal or situation. What blockages do you feel are present?',
    isDigital: true,
    isActive: true,
  },
  {
    slug: 'protection-cleanse',
    title: 'Full Spiritual Protection Cleanse — Remove Negative Energy & Curses',
    description: `Feeling drained, unlucky, or like something is working against you? This comprehensive cleanse removes negative energy, breaks hexes and curses, and fortifies your aura with protective white light.\n\n✦ Includes salt, smoke, and water ritual\n✦ Protective prayer personalized to you\n✦ Cleanse report + maintenance tips`,
    price: 27.99,
    originalPrice: 47.99,
    category: 'Protection',
    images: ['/images/protection-cleanse.jpg'],
    personalizationPrompt: 'Your full name, DOB, and location (city/state). Describe what you have been experiencing. How long has it been going on?',
    isDigital: true,
    isActive: true,
  },
  {
    slug: 'ex-love-reading',
    title: 'Ex Love Reading — Will They Come Back? Full Truth Revealed',
    description: `A focused reading on your ex's current feelings, thoughts about you, and the probability of reconciliation. This reading uses Tarot + pendulum for yes/no confirmation on the most important questions.\n\n✦ Does he/she still love you?\n✦ Is there a future together?\n✦ What is the timeline?\n✦ Delivered within 24 hours`,
    price: 11.99,
    originalPrice: 21.99,
    category: 'Readings',
    images: ['/images/ex-reading.jpg'],
    personalizationPrompt: 'Your full name and DOB. Ex\'s full name and DOB. When did you break up and why? Have you been in contact?',
    isDigital: true,
    isActive: true,
  },
]

const reviews = [
  {
    reviewerName: 'Sarah M.',
    reviewerAvatar: '',
    rating: 5,
    body: 'I ordered the reconciliation spell and within 2 weeks my ex reached out after 3 months of no contact. I am absolutely blown away. She is professional, communicative, and delivers exactly what she promises. Will be back!',
    purchasedItem: 'Powerful Reconciliation Spell',
  },
  {
    reviewerName: 'Destiny R.',
    reviewerAvatar: '',
    rating: 5,
    body: 'The contact me spell worked within 4 days!! He texted me out of nowhere after 6 weeks of silence. I was a skeptic but I am now a true believer. Thank you so much, you have no idea what this means to me.',
    purchasedItem: 'Contact Me Spell',
  },
  {
    reviewerName: 'jasmine_l',
    reviewerAvatar: '',
    rating: 5,
    body: 'Got the same-hour reading and she was so accurate it gave me chills. She described my situation exactly without me giving any details. The guidance she provided was exactly what I needed to hear. Highly recommend!',
    purchasedItem: 'Same-Hour Accurate Psychic Reading',
  },
  {
    reviewerName: 'Brittany K.',
    reviewerAvatar: '',
    rating: 5,
    body: 'Ordered the energy alignment reading. Very detailed and thorough. She picked up on things that no one else could have known. Timeline she gave was spot on. I trust her completely with my situation.',
    purchasedItem: 'Personalized Relationship Energy Alignment Reading',
  },
  {
    reviewerName: 'moona_star',
    reviewerAvatar: '',
    rating: 5,
    body: 'The road opener spell has been working! I got a job offer I wasn\'t expecting and two old debts were forgiven within a month. Energy has completely shifted. Already ordered another service.',
    purchasedItem: 'Road Opener & Money Attraction Spell',
  },
  {
    reviewerName: 'Cassandra T.',
    reviewerAvatar: '',
    rating: 5,
    body: 'She did the protection cleanse for me after I was feeling very heavy and cursed. The shift happened almost immediately. I feel lighter, luckier, and more like myself. She also gave me maintenance tips to keep my energy clear.',
    purchasedItem: 'Full Spiritual Protection Cleanse',
  },
  {
    reviewerName: 'lovelight22',
    reviewerAvatar: '',
    rating: 5,
    body: 'The tantric working she did for me had my situationship blowing up my phone within a week. He had been cold for months. Now he’s talking about commitment. Whatever she did worked!!',
    purchasedItem: 'Make Him Miss You — Tantric Obsession Working',
  },
  {
    reviewerName: 'Rachel V.',
    reviewerAvatar: '',
    rating: 4,
    body: 'Great reading! Very accurate and she provides a lot of detail. Took a little longer than expected but the quality made it worth the wait. Will definitely order again.',
    purchasedItem: 'Fidelity & Extreme Love Tarot Reading',
  },
  {
    reviewerName: 'Nadia J.',
    reviewerAvatar: '',
    rating: 5,
    body: 'I have been ordering from this shop for over a year. Every reading has been accurate and every spell has shown results. She is the real deal. If you are on the fence, just do it — you won\'t regret it.',
    purchasedItem: 'Ex Love Reading',
  },
  {
    reviewerName: 'starfire_b',
    reviewerAvatar: '',
    rating: 5,
    body: 'My dog was having health issues and I ordered the pet protection spell. His vet visit showed improvement and his energy is so much better. Thank you for caring about animals too!',
    purchasedItem: 'Pet Protection Spell',
  },
]

console.log('Seeding products...')
for (const p of products) {
  createProduct(p)
}

console.log('Seeding reviews...')
for (const r of reviews) {
  createReview(r)
}

// Seed a welcome coupon
db.prepare(`INSERT INTO coupons (id, code, discount_type, amount, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)`)
  .run('coupon-welcome', 'WELCOME10', 'percent', 10, new Date().toISOString())

console.log('Seed complete! Products:', products.length, '| Reviews:', reviews.length)
