'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock, ArrowRight } from 'lucide-react'

export default function LoginForm({ redirectTo, hasError }: { redirectTo: string; hasError: boolean }) {
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  return (
    <form action="/api/login" method="POST" onSubmit={() => setSubmitting(true)} className="mt-6">
      <input type="hidden" name="redirect" value={redirectTo} />

      <label htmlFor="password" className="mb-1.5 block text-xs font-medium" style={{ color: '#A1A1AA' }}>
        Password
      </label>
      <div className="relative">
        <Lock
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: '#5A5A4A' }}
        />
        <input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          required
          autoFocus
          placeholder="••••••••"
          className="w-full rounded-xl border bg-transparent py-3 pl-10 pr-11 text-sm text-white outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#5A5A4A] focus:border-[#F0A030] focus:ring-2 focus:ring-[#F0A030]/20"
          style={{ borderColor: hasError ? '#EF4444' : '#23262F', background: '#0F1115' }}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors duration-150 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0A030]/40"
          style={{ color: '#A1A1AA' }}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {hasError && (
        <p className="mt-2 text-xs font-medium" style={{ color: '#EF4444' }}>
          Password salah. Coba lagi.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-[#0F1115] transition-[transform,box-shadow,opacity] duration-150 hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0A030]/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        style={{
          background: 'linear-gradient(135deg, #FFD479 0%, #F0A030 55%, #C97D14 100%)',
          boxShadow: '0 8px 24px -8px rgba(240,160,48,0.55)',
        }}
      >
        {submitting ? 'Memproses…' : 'Masuk'}
        {!submitting && <ArrowRight size={16} />}
      </button>
    </form>
  )
}
