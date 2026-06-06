'use client'
// This is a client boundary wrapper so cart state (zustand) works in the tree
export default function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
