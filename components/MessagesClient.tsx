'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthProvider'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Search, Send } from 'lucide-react'

interface Message {
  id: string
  user_id: string
  sender: 'customer' | 'seller'
  body: string
  read_at: string | null
  created_at: string
}

export default function MessagesClient() {
  const { user, loading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [tab, setTab] = useState<'all' | 'seller'>('all')
  const [search, setSearch] = useState('')
  const [fetching, setFetching] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!user) { setFetching(false); return }
    fetchMessages()

    // Real-time subscription
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `user_id=eq.${user.id}` },
        (payload) => setMessages(prev => [...prev, payload.new as Message])
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
    setFetching(false)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMsg.trim() || !user) return
    setSending(true)
    await supabase.from('messages').insert({
      user_id: user.id,
      sender: 'customer',
      body: newMsg.trim(),
    })
    setNewMsg('')
    setSending(false)
  }

  if (loading || fetching) {
    return <div className="flex items-center justify-center min-h-[60vh] text-gray-400">Loading...</div>
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="mb-4" style={{ color: '#6b6670' }}>Sign in to view your messages.</p>
        <Link href="/account" className="px-8 py-3 rounded-full font-bold text-white text-sm" style={{ backgroundColor: '#1a1040' }}>Sign in</Link>
      </div>
    )
  }

  const firstName = user.user_metadata?.first_name || user.email?.split('@')[0] || 'You'
  const initials = firstName.slice(0, 1).toUpperCase()

  const filtered = messages.filter(m =>
    (tab === 'seller' ? m.sender === 'seller' : true) &&
    (search ? m.body.toLowerCase().includes(search.toLowerCase()) : true)
  )

  const hasConversation = messages.length > 0

  return (
    <div className="max-w-md mx-auto flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/account" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#f5f0e8' }}>
            <ArrowLeft size={18} style={{ color: '#1a1040' }} />
          </Link>
          {/* Search bar */}
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full" style={{ backgroundColor: '#f5f0e8' }}>
            <Search size={15} style={{ color: '#6b6670' }} />
            <input
              type="text"
              placeholder="Search in messages"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: '#1a1040' }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setTab('all')}
            className="px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: tab === 'all' ? 'white' : '#1a1040', color: tab === 'all' ? '#1a1040' : 'white', border: tab === 'all' ? '1px solid #e5e7eb' : 'none' }}
          >
            All messages
          </button>
          <button
            onClick={() => setTab('seller')}
            className="px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: tab === 'seller' ? 'white' : '#1a1040', color: tab === 'seller' ? '#1a1040' : 'white', border: tab === 'seller' ? '1px solid #e5e7eb' : 'none' }}
          >
            From TheThirteenCoven
          </button>
        </div>
      </div>

      {/* Conversation thread or empty state */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {!hasConversation ? (
          /* No messages yet — show the thread list view with a start button */
          <div
            className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white cursor-pointer shadow-sm"
            style={{ borderRadius: 20 }}
            onClick={() => document.getElementById('msg-input')?.focus()}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg font-bold text-white" style={{ backgroundColor: '#1a1040' }}>
              🔮
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: '#1a1040' }}>TheThirteenCoven</p>
              <p className="text-xs truncate" style={{ color: '#6b6670' }}>Tap to send your first message...</p>
            </div>
          </div>
        ) : (
          /* Messages thread */
          <div className="space-y-3">
            {filtered.map(msg => {
              const isCustomer = msg.sender === 'customer'
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isCustomer ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ backgroundColor: isCustomer ? '#1a1040' : '#c9a84c', color: 'white' }}>
                    {isCustomer ? initials : '🔮'}
                  </div>
                  {/* Bubble */}
                  <div
                    className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={{
                      backgroundColor: isCustomer ? '#1a1040' : 'white',
                      color: isCustomer ? 'white' : '#1a1040',
                      border: isCustomer ? 'none' : '1px solid #e5e7eb',
                      borderBottomRightRadius: isCustomer ? 4 : 16,
                      borderBottomLeftRadius: isCustomer ? 16 : 4,
                    }}
                  >
                    {msg.body}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="px-4 py-3 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm mx-4 mb-4">
        {!hasConversation && (
          <p className="text-xs mb-2 text-center" style={{ color: '#6b6670' }}>
            Send a message to TheThirteenCoven
          </p>
        )}
        <form onSubmit={sendMessage} className="flex gap-2 items-end">
          <textarea
            id="msg-input"
            rows={1}
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as unknown as React.FormEvent) } }}
            placeholder="Type a message..."
            className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none"
            style={{ maxHeight: 100 }}
          />
          <button
            type="submit"
            disabled={sending || !newMsg.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
            style={{ backgroundColor: '#1a1040' }}
          >
            <Send size={16} className="text-white" />
          </button>
        </form>
      </div>
    </div>
  )
}
