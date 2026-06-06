'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Props {
  onClose: () => void
  onSuccess: (reason?: string) => void
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.274h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  )
}

export default function AuthModal({ onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<'signin' | 'register'>('signin')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else onSuccess()
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName } },
    })
    if (error) { setError(error.message); setLoading(false) }
    else {
      // Close modal immediately — show confirmation banner outside
      onSuccess('confirm')
    }
  }

  async function handleOAuth(provider: 'google' | 'facebook' | 'apple') {
    setSocialLoading(provider)
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/account` },
    })
  }

  const socialButtons = [
    { provider: 'google' as const, label: 'Continue with Google', icon: <GoogleIcon /> },
    { provider: 'facebook' as const, label: 'Continue with Facebook', icon: <FacebookIcon /> },
    { provider: 'apple' as const, label: 'Continue with Apple', icon: <AppleIcon /> },
  ]

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 pb-10 sm:pb-6 overflow-y-auto max-h-[95vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1a1040' }}>
            {tab === 'signin' ? 'Sign in' : 'Create your account'}
          </h2>
          <div className="flex items-center gap-2">
            {tab === 'signin' && (
              <button
                onClick={() => { setTab('register'); setError('') }}
                className="text-sm font-semibold px-4 py-1.5 rounded-full border-2"
                style={{ borderColor: '#1a1040', color: '#1a1040' }}
              >
                Register
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {tab === 'register' && (
          <p className="text-sm mb-4" style={{ color: '#6b6670' }}>Registration is easy.</p>
        )}

        {(
          <>
            <form onSubmit={tab === 'signin' ? handleSignIn : handleRegister} className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#1a1040' }}>
                  Email address {tab === 'register' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-500"
                />
              </div>

              {tab === 'register' && (
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#1a1040' }}>
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" required value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#1a1040' }}>
                  Password {tab === 'register' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password" required value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-500"
                />
              </div>

              {tab === 'signin' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#1a1040' }}>
                    <input type="checkbox" defaultChecked className="rounded" />
                    Stay signed in
                  </label>
                  <button type="button" className="text-sm underline" style={{ color: '#6b6670' }}>
                    Forgot your password?
                  </button>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 rounded-full font-bold text-white text-sm disabled:opacity-60"
                style={{ backgroundColor: '#1a1040' }}
              >
                {loading ? 'Please wait...' : tab === 'signin' ? 'Sign in' : 'Register'}
              </button>

              {tab === 'signin' && (
                <p className="text-center text-xs" style={{ color: '#6b6670' }}>
                  Trouble signing in?{' '}
                  <button type="button" className="underline">Get help</button>
                </p>
              )}
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-semibold tracking-widest" style={{ color: '#6b6670' }}>OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Social buttons */}
            <div className="space-y-2.5">
              {socialButtons.map(({ provider, label, icon }) => (
                <button
                  key={provider}
                  onClick={() => handleOAuth(provider)}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-full border-2 font-semibold text-sm transition-all disabled:opacity-60"
                  style={{ borderColor: '#1a1040', color: '#1a1040', backgroundColor: 'white' }}
                >
                  {socialLoading === provider ? (
                    <span className="text-xs">Redirecting...</span>
                  ) : (
                    <>{icon} {label}</>
                  )}
                </button>
              ))}
            </div>

            {/* Footer text */}
            <p className="text-xs mt-5 leading-relaxed" style={{ color: '#6b6670' }}>
              By clicking Sign in, Register, or Continue with Google, Facebook, or Apple, you agree to our{' '}
              <span className="underline cursor-pointer">Terms of Use</span> and{' '}
              <span className="underline cursor-pointer">Privacy Policy</span>.
            </p>

            {tab === 'signin' ? (
              <p className="text-center text-sm mt-3" style={{ color: '#6b6670' }}>
                New customer?{' '}
                <button onClick={() => { setTab('register'); setError('') }} className="font-semibold underline" style={{ color: '#1a1040' }}>
                  Create an account
                </button>
              </p>
            ) : (
              <p className="text-center text-sm mt-3" style={{ color: '#6b6670' }}>
                Already have an account?{' '}
                <button onClick={() => { setTab('signin'); setError('') }} className="font-semibold underline" style={{ color: '#1a1040' }}>
                  Sign in
                </button>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

