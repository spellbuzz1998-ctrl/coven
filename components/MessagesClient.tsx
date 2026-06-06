'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthProvider'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Send, Camera, X } from 'lucide-react'
import Image from 'next/image'

interface Message {
  id: string
  user_id: string
  sender: 'customer' | 'seller'
  body: string
  image_url?: string | null
  read_at: string | null
  created_at: string
}

export default function MessagesClient() {
  const { user, loading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!user) { setFetching(false); return }
    fetchMessages()

    const channel = supabase
      .channel('messages-customer')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
    setFetching(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior }), 80)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const path = `${user!.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('message-images').upload(path, file)
    if (error) { console.error('Image upload error:', error.message); return null }
    const { data } = supabase.storage.from('message-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if ((!newMsg.trim() && !imageFile) || !user) return
    setSending(true)

    let image_url: string | null = null
    if (imageFile) {
      image_url = await uploadImage(imageFile)
    }

    await supabase.from('messages').insert({
      user_id: user.id,
      sender: 'customer',
      body: newMsg.trim() || '',
      image_url,
    })

    setNewMsg('')
    removeImage()
    setSending(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f0e8' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1a1040' }} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f0e8' }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: '#6b6670' }}>Sign in to view your messages.</p>
          <Link href="/account" className="px-8 py-3 rounded-full font-bold text-white text-sm" style={{ backgroundColor: '#1a1040' }}>Sign in</Link>
        </div>
      </div>
    )
  }

  const displayName = user.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
    : user.email?.split('@')[0] || 'You'

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 0px)', backgroundColor: '#f5f0e8' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0 bg-white" style={{ borderColor: '#e5e7eb' }}>
        <Link href="/account"
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#f5f0e8' }}>
          <ArrowLeft size={18} style={{ color: '#1a1040' }} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: '#1a1040' }}>
            {displayName} · TheThirteenCoven
          </p>
          <p className="text-xs" style={{ color: '#6b6670' }}>Typically responds within a few hours</p>
        </div>
      </div>

      {/* Pinned product card */}
      <div className="mx-4 mt-3 mb-1 flex items-center gap-3 rounded-2xl px-3 py-2.5 bg-white shrink-0"
        style={{ border: '1px solid #e5e7eb' }}>
        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100">
          <Image src="/images/placeholder.jpg" alt="Product" width={48} height={48} className="object-cover w-full h-full" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: '#1a1040' }}>Reconciliation Spell for Avoidant Partner...</p>
          <p className="text-xs mt-0.5 font-semibold" style={{ color: '#c9a84c' }}>$15.00 USD</p>
        </div>
      </div>

      {/* Messages thread */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: '#6b6670' }}>No messages yet. Say hello! 👋</p>
          </div>
        )}
        {messages.map(msg => {
          const isCustomer = msg.sender === 'customer'
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isCustomer ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isCustomer && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: '#c9a84c', color: 'white' }}>
                  T
                </div>
              )}
              <div className={`flex flex-col gap-1 max-w-[75%] ${isCustomer ? 'items-end' : 'items-start'}`}>
                {msg.image_url && (
                  <div className="rounded-2xl overflow-hidden" style={{ maxWidth: 220 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={msg.image_url} alt="Sent image" className="w-full object-cover rounded-2xl" />
                  </div>
                )}
                {msg.body && (
                  <div className="px-4 py-2.5 rounded-3xl text-sm leading-relaxed"
                    style={{
                      backgroundColor: isCustomer ? '#1a1040' : 'white',
                      color: isCustomer ? 'white' : '#1a1040',
                      border: isCustomer ? 'none' : '1px solid #e5e7eb',
                      borderBottomRightRadius: isCustomer ? 6 : 24,
                      borderBottomLeftRadius: isCustomer ? 24 : 6,
                    }}>
                    {msg.body}
                  </div>
                )}
                <p className="text-xs px-1" style={{ color: '#9ca3af' }}>
                  {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="mx-4 mb-2 flex items-center gap-2 shrink-0">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button onClick={removeImage}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center bg-white shadow">
              <X size={10} style={{ color: '#1a1040' }} />
            </button>
          </div>
          <p className="text-xs" style={{ color: '#6b6670' }}>Image ready to send</p>
        </div>
      )}

      {/* Input bar */}
      <div className="px-3 py-3 shrink-0 bg-white border-t" style={{ borderColor: '#e5e7eb' }}>
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#f5f0e8' }}>
            <Camera size={18} style={{ color: '#6b6670' }} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          <input
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as unknown as React.FormEvent) } }}
            placeholder="Write a message"
            className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
            style={{ backgroundColor: '#f5f0e8', border: '1px solid #e5e7eb', color: '#1a1040' }}
          />

          <button type="submit"
            disabled={sending || (!newMsg.trim() && !imageFile)}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
            style={{ backgroundColor: '#1a1040' }}>
            <Send size={16} className="text-white" />
          </button>
        </form>
      </div>
    </div>
  )
}
