'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './AuthProvider'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Send, Camera, X } from 'lucide-react'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

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
  const [sendError, setSendError] = useState('')
  const [loadError, setLoadError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // Track object URLs and timers so they can be released on unmount.
  const previewUrlRef = useRef<string | null>(null)
  const scrollTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const supabase = createClient()

  const scheduleScroll = useCallback((behavior: ScrollBehavior, delay: number) => {
    const id = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior }), delay)
    scrollTimers.current.push(id)
  }, [])

  const fetchMessages = useCallback(async () => {
    // Yield first so this never sets state synchronously inside the effect
    // body that calls it.
    await Promise.resolve()
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) {
      setLoadError('We could not load your messages right now.')
    } else {
      setLoadError('')
      setMessages(data ?? [])
    }
    setFetching(false)
    scheduleScroll('instant' as ScrollBehavior, 80)
  }, [supabase, scheduleScroll])

  useEffect(() => {
    if (!user) return
    // Synchronising with Supabase (an external system) is the intended use of an
    // effect. State writes happen after an await and the channel is torn down below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages()

    const channel = supabase
      .channel('messages-customer')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const incoming = payload.new as Message
        // Realtime can echo a message we just inserted — de-duplicate by id.
        setMessages(prev => prev.some(m => m.id === incoming.id) ? prev : [...prev, incoming])
        scheduleScroll('smooth', 50)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, supabase, fetchMessages, scheduleScroll])

  // Release the preview blob URL and any pending scroll timers on unmount.
  useEffect(() => {
    const timers = scrollTimers.current
    return () => {
      timers.forEach(clearTimeout)
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSendError('')
    if (!file.type.startsWith('image/')) {
      setSendError('Please choose an image file.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setSendError('That image is larger than 5 MB. Please pick a smaller one.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    // Revoke the previous preview before replacing it, or the blob leaks.
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(file)
    previewUrlRef.current = url
    setImageFile(file)
    setImagePreview(url)
  }

  function removeImage() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const path = `${user!.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('message-images').upload(path, file)
    if (error) return null
    const { data } = supabase.storage.from('message-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    // Guard against Enter-key and button submitting the same message twice.
    if (sending) return
    if ((!newMsg.trim() && !imageFile) || !user) return
    setSending(true)
    setSendError('')

    let image_url: string | null = null
    if (imageFile) {
      image_url = await uploadImage(imageFile)
      if (!image_url) {
        setSendError('Your image could not be uploaded. Please try again.')
        setSending(false)
        return
      }
    }

    const { error } = await supabase.from('messages').insert({
      user_id: user.id,
      sender: 'customer',
      body: newMsg.trim() || '',
      image_url,
    })

    if (error) {
      // Keep the text in the box so the customer doesn't lose what they wrote.
      setSendError('Your message could not be sent. Please try again.')
      setSending(false)
      return
    }

    setNewMsg('')
    removeImage()
    setSending(false)
    scheduleScroll('smooth', 50)
  }

  // Only signed-in visitors wait on the message request.
  if (loading || (user && fetching)) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f0e8' }} role="status" aria-label="Loading messages">
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

      {/* Messages thread */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {loadError && (
          <div className="text-center py-6" role="alert">
            <p className="text-sm mb-3" style={{ color: '#b91c1c' }}>{loadError}</p>
            <button
              onClick={() => { setFetching(true); fetchMessages() }}
              className="px-4 py-2 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: '#1a1040' }}
            >
              Try again
            </button>
          </div>
        )}
        {!loadError && messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: '#4b5563' }}>No messages yet. Say hello! 👋</p>
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
        {sendError && (
          <p className="text-xs mb-2 px-1" style={{ color: '#b91c1c' }} role="alert">{sendError}</p>
        )}
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <button type="button" onClick={() => fileRef.current?.click()}
            aria-label="Attach an image"
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#f5f0e8' }}>
            <Camera size={18} style={{ color: '#4b5563' }} aria-hidden="true" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          <label htmlFor="message-input" className="sr-only">Write a message</label>
          <input
            id="message-input"
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            placeholder="Write a message"
            className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
            style={{ backgroundColor: '#f5f0e8', border: '1px solid #e5e7eb', color: '#1a1040' }}
          />

          <button type="submit"
            disabled={sending || (!newMsg.trim() && !imageFile)}
            aria-label="Send message"
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#1a1040' }}>
            <Send size={16} className="text-white" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  )
}
