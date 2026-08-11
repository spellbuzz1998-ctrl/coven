import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useSyncExternalStore } from 'react'

export interface CartItem {
  id: string
  productId: string
  slug: string
  title: string
  price: number
  listPrice?: number // pre-shop-sale unit price; defaults to price when no sale
  image: string
  quantity: number
  personalization?: string
  variantIdx?: number | null // index into product.variants; server re-prices from this
}

export interface AppliedCoupon {
  code: string
  discount: number // percentage off, or dollar amount when type is 'fixed'
  type?: 'percentage' | 'fixed'
}

interface CartStore {
  items: CartItem[]
  coupon: AppliedCoupon | null
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  setCoupon: (coupon: AppliedCoupon | null) => void
  listSubtotal: () => number
  total: () => number
  saleDiscount: () => number
  discountAmount: () => number
  grandTotal: () => number
  count: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      addItem: (item) => {
        const existing = get().items.find(i => i.id === item.id)
        if (existing) {
          set(s => ({ items: s.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) }))
        } else {
          set(s => ({ items: [...s.items, { ...item, quantity: 1 }] }))
        }
      },
      removeItem: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          set(s => ({ items: s.items.filter(i => i.id !== id) }))
        } else {
          set(s => ({ items: s.items.map(i => i.id === id ? { ...i, quantity } : i) }))
        }
      },
      clearCart: () => set({ items: [], coupon: null }),
      setCoupon: (coupon) => set({ coupon }),
      listSubtotal: () => get().items.reduce((sum, i) => sum + (i.listPrice ?? i.price) * i.quantity, 0),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      saleDiscount: () => {
        const list = get().items.reduce((sum, i) => sum + (i.listPrice ?? i.price) * i.quantity, 0)
        const sale = get().items.reduce((sum, i) => sum + i.price * i.quantity, 0)
        return Math.round((list - sale) * 100) / 100
      },
      discountAmount: () => {
        const c = get().coupon
        if (!c) return 0
        const subtotal = get().items.reduce((sum, i) => sum + i.price * i.quantity, 0)
        if (c.type === 'fixed') return Math.min(c.discount, subtotal)
        return Math.round(subtotal * c.discount / 100 * 100) / 100
      },
      grandTotal: () => {
        const subtotal = get().items.reduce((sum, i) => sum + i.price * i.quantity, 0)
        return Math.round((subtotal - get().discountAmount()) * 100) / 100
      },
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'thirteencoven-cart' }
  )
)

// The cart lives in localStorage, so the server renders 0 items while the browser
// may have more. Components read the count through this hook to render 0 during
// hydration and the real number afterwards — without a setState-in-effect.
const emptyCount = () => 0

export function useCartCount(): number {
  return useSyncExternalStore(
    useCart.subscribe,
    () => useCart.getState().count(),
    emptyCount // server + first client render agree on 0
  )
}
