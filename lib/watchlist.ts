import { createClient } from './supabase'

export interface WatchlistItem {
  id: string
  user_id: string
  product_slug: string
  product_title: string
  product_price: number
  product_image: string
  created_at: string
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('watchlist')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function addToWatchlist(item: Omit<WatchlistItem, 'id' | 'user_id' | 'created_at'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  return supabase.from('watchlist').insert({ ...item, user_id: user.id })
}

export async function removeFromWatchlist(productSlug: string) {
  const supabase = createClient()
  return supabase.from('watchlist').delete().eq('product_slug', productSlug)
}

export async function isInWatchlist(productSlug: string): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase
    .from('watchlist')
    .select('id')
    .eq('product_slug', productSlug)
    .maybeSingle()
  return !!data
}
