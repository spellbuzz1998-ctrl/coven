import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

// GET /api/admin/messages — returns all conversations (one per user)
export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by user_id — keep latest message per conversation
  const map = new Map<string, {
    user_id: string
    display_name: string
    last_message: string
    last_at: string
    unread: number
  }>()

  for (const msg of data) {
    if (!map.has(msg.user_id)) {
      map.set(msg.user_id, {
        user_id: msg.user_id,
        display_name: 'Customer',
        last_message: msg.body,
        last_at: msg.created_at,
        unread: msg.sender === 'customer' && !msg.read_at ? 1 : 0,
      })
    } else if (msg.sender === 'customer' && !msg.read_at) {
      map.get(msg.user_id)!.unread++
    }
  }

  // Enrich with user emails/names from auth.users
  const userIds = Array.from(map.keys())
  if (userIds.length > 0) {
    const { data: { users } } = await supabase.auth.admin.listUsers()
    if (users) {
      for (const u of users) {
        if (map.has(u.id)) {
          const firstName = u.user_metadata?.first_name || ''
          const lastName = u.user_metadata?.last_name || ''
          const fullName = (firstName + ' ' + lastName).trim()
          const displayName = fullName || u.email?.split('@')[0] || 'Customer'
          map.get(u.id)!.display_name = displayName
        }
      }
    }
  }

  return NextResponse.json({ conversations: Array.from(map.values()) })
}
