'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Language } from '@/types'

const STORAGE_KEY = 'serasa_lang'

const LANGUAGES: {
  code: Language
  flag: string
  native: string
  greeting: string
  sub: string
  dir: 'ltr' | 'rtl'
}[] = [
  { code: 'id', flag: '🇮🇩', native: 'Bahasa Indonesia', greeting: 'Selamat Datang', sub: 'Pilih bahasa untuk melanjutkan', dir: 'ltr' },
  { code: 'en', flag: '🇬🇧', native: 'English',          greeting: 'Welcome',          sub: 'Choose language to continue',    dir: 'ltr' },
  { code: 'ar', flag: '🇸🇦', native: 'العربية',           greeting: 'أهلاً وسهلاً',      sub: 'اختر اللغة للمتابعة',            dir: 'rtl' },
]

export default function LanguageSelectionPage() {
  const router = useRouter()
  const [tableNumber, setTableNumber] = useState('1')
  const [selecting, setSelecting] = useState<Language | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
  }, [])

  function selectLanguage(lang: Language) {
    if (selecting) return
    setSelecting(lang)
    try { localStorage.setItem(STORAGE_KEY, lang) } catch {}
    setTimeout(() => router.push(`/menu?table=${tableNumber}`), 350)
  }

  if (!mounted) return null

  return (
    <div className="min-h-dvh bg-[#080806] flex flex-col items-center justify-center px-5 py-12 relative overflow-hidden">

      {/* ── Layered ambient glows ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(194,75,42,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[10%] left-[10%] w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)' }} />
        <div className="absolute top-[5%] right-[5%] w-48 h-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(61,124,50,0.08) 0%, transparent 70%)' }} />
      </div>

      {/* ── Grain texture ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.35]" aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }} />

      {/* ── Content wrapper ── */}
      <div className="relative z-10 w-full max-w-[340px] mx-auto flex flex-col items-center">

        {/* Logo */}
        <div
          className="mb-2"
          style={{ opacity: 0, animation: 'fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s forwards' }}
        >
          <div className="relative w-[200px] h-[72px]">
            <Image
              src="/logo.png"
              alt="Serasa Restaurant"
              fill
              className="object-contain drop-shadow-[0_0_40px_rgba(194,75,42,0.3)]"
              priority
              sizes="200px"
            />
          </div>
        </div>

        {/* Tagline */}
        <p
          className="text-[#5A4A3A] text-[11px] tracking-[3px] uppercase mb-10"
          style={{ opacity: 0, animation: 'fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s forwards' }}
        >
          from indonesia for the world
        </p>

        {/* Divider with label */}
        <div
          className="flex items-center gap-3 w-full mb-6"
          style={{ opacity: 0, animation: 'fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s forwards' }}
        >
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.25))' }} />
          <span className="text-[#6A5A4A] text-[10px] font-medium tracking-[5px] uppercase flex-shrink-0">
            Pilih Bahasa
          </span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(212,175,55,0.25))' }} />
        </div>

        {/* Language cards */}
        <div className="w-full space-y-3">
          {LANGUAGES.map((lang, idx) => {
            const isSelecting = selecting === lang.code
            return (
              <button
                key={lang.code}
                onClick={() => selectLanguage(lang.code)}
                disabled={!!selecting}
                dir={lang.dir}
                aria-label={`Select ${lang.native}`}
                className="w-full group"
                style={{
                  opacity: 0,
                  animation: `fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) ${0.4 + idx * 0.1}s forwards`,
                }}
              >
                <div
                  className="relative overflow-hidden rounded-2xl border transition-all duration-300"
                  style={{
                    background: isSelecting
                      ? 'rgba(194,75,42,0.15)'
                      : 'rgba(20,18,14,0.95)',
                    borderColor: isSelecting
                      ? 'rgba(194,75,42,0.55)'
                      : 'rgba(212,175,55,0.1)',
                    transform: isSelecting ? 'scale(0.98)' : undefined,
                    boxShadow: isSelecting
                      ? '0 0 0 1px rgba(194,75,42,0.3), 0 8px 32px rgba(194,75,42,0.15)'
                      : '0 2px 12px rgba(0,0,0,0.4)',
                  }}
                >
                  {/* hover shimmer */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(212,175,55,0.04) 60%, transparent 80%)' }}
                  />

                  <div className="flex items-center gap-4 px-5 py-4">
                    <span className="text-[32px] leading-none flex-shrink-0">{lang.flag}</span>

                    <div className={`flex-1 min-w-0 ${lang.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      <p className="text-white font-semibold text-[15px] leading-tight"
                        style={{ fontFamily: lang.code === 'ar' ? 'var(--font-noto-arabic), serif' : undefined }}>
                        {lang.native}
                      </p>
                      <p className="text-[#6A5A4A] text-[11px] mt-0.5"
                        style={{ fontFamily: lang.code === 'ar' ? 'var(--font-noto-arabic), serif' : undefined }}>
                        {lang.greeting}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      {isSelecting ? (
                        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                          style={{ borderColor: 'rgba(194,75,42,0.8)', borderTopColor: 'transparent' }} />
                      ) : (
                        <div
                          className="w-5 h-5 rounded-full border transition-all duration-300 group-hover:border-[rgba(212,175,55,0.5)] group-hover:bg-[rgba(212,175,55,0.05)]"
                          style={{ borderColor: 'rgba(212,175,55,0.18)' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Table indicator */}
        <div
          className="mt-10 flex items-center gap-2"
          style={{ opacity: 0, animation: 'fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) 0.75s forwards' }}
        >
          <span className="text-[#3A3028] text-[10px] tracking-widest uppercase">
            Meja · Table · طاولة
          </span>
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: 'rgba(212,175,55,0.1)', color: 'rgba(212,175,55,0.6)', border: '1px solid rgba(212,175,55,0.15)' }}
          >
            {tableNumber}
          </span>
        </div>

        {/* Decorative leaves echo */}
        <div
          className="mt-6 text-[28px] opacity-[0.06] select-none"
          style={{ opacity: 0, animation: 'fadeUp 0.75s cubic-bezier(0.16,1,0.3,1) 0.85s forwards, leafFloat 4s ease-in-out 1.5s infinite' }}
        >
          🌿
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes leafFloat {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50%       { transform: translateY(-6px) rotate(5deg); }
        }
      `}</style>
    </div>
  )
}
