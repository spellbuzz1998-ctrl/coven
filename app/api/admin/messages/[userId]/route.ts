import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

// GET /api/admin/messages/[userId] — full thread for one customer
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mark unread customer messages as read
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('sender', 'customer')
    .is('read_at', null)

  return NextResponse.json({ messages: data })
}

// POST /api/admin/messages/[userId] — seller reply
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('messages')
    .insert({ user_id: userId, sender: 'seller', body: body.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data })
}
