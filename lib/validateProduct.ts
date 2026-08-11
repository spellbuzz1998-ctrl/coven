import type { Product, ProductVariant } from './products'

// Shared validation for the admin product endpoints. Without this, a malformed
// payload reaches SQLite, violates a NOT NULL constraint and returns a 500 HTML
// page that the admin panel then fails to parse.
export interface ValidationResult {
  ok: boolean
  error?: string
  data?: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
}

const MAX_IMAGES = 15
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function cleanVariants(raw: unknown): ProductVariant[] | undefined {
  if (!Array.isArray(raw)) return undefined
  return raw
    .filter((v): v is Record<string, unknown> => !!v && typeof v === 'object')
    .map(v => ({
      name: String(v.name ?? '').slice(0, 120),
      price: Number(v.price) || 0,
      originalPrice: v.originalPrice != null && Number.isFinite(Number(v.originalPrice))
        ? Number(v.originalPrice)
        : undefined,
    }))
    .filter(v => v.name && Number.isFinite(v.price) && v.price >= 0)
}

function cleanImages(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined
  return raw
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    .slice(0, MAX_IMAGES)
}

// `partial` allows PATCH to send only the fields being changed.
export function validateProductInput(body: unknown, partial: boolean): ValidationResult {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request body' }
  const b = body as Record<string, unknown>
  const data: Record<string, unknown> = {}

  if (b.title !== undefined || !partial) {
    const title = String(b.title ?? '').trim()
    if (!title) return { ok: false, error: 'Title is required' }
    data.title = title.slice(0, 300)
  }

  if (b.slug !== undefined || !partial) {
    const slug = String(b.slug ?? '').trim().toLowerCase()
    if (!slug) return { ok: false, error: 'Slug is required' }
    if (!SLUG_RE.test(slug)) {
      return { ok: false, error: 'Slug may only contain lowercase letters, numbers and hyphens' }
    }
    data.slug = slug.slice(0, 200)
  }

  if (b.price !== undefined || !partial) {
    const price = Number(b.price)
    if (!Number.isFinite(price) || price <= 0) {
      return { ok: false, error: 'Price must be a number greater than 0' }
    }
    data.price = Math.round(price * 100) / 100
  }

  if (b.originalPrice !== undefined) {
    const original = Number(b.originalPrice)
    data.originalPrice = Number.isFinite(original) && original > 0 ? Math.round(original * 100) / 100 : undefined
  }

  if (b.category !== undefined || !partial) {
    data.category = String(b.category ?? 'Other').trim().slice(0, 120) || 'Other'
  }

  if (b.description !== undefined || !partial) {
    data.description = String(b.description ?? '').slice(0, 20000)
  }

  if (b.images !== undefined) data.images = cleanImages(b.images) ?? []
  else if (!partial) data.images = []

  if (b.variants !== undefined) data.variants = cleanVariants(b.variants) ?? []
  else if (!partial) data.variants = []

  if (b.video !== undefined) data.video = String(b.video ?? '').slice(0, 500)
  else if (!partial) data.video = ''

  if (b.personalizationPrompt !== undefined) {
    const prompt = String(b.personalizationPrompt ?? '').slice(0, 1000)
    data.personalizationPrompt = prompt || undefined
  }

  if (b.saleEndsAt !== undefined) {
    const raw = String(b.saleEndsAt ?? '').trim()
    data.saleEndsAt = raw && !Number.isNaN(new Date(raw).getTime()) ? raw : undefined
  }

  if (b.isDigital !== undefined) data.isDigital = !!b.isDigital
  else if (!partial) data.isDigital = true

  if (b.isActive !== undefined) data.isActive = !!b.isActive
  else if (!partial) data.isActive = true

  return { ok: true, data: data as Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>> }
}
