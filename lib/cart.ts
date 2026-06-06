import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  slug: string
  title: string
  price: number
  image: string
  quantity: number
  personalization?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  count: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
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
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'thirteencoven-cart' }
  )
)
