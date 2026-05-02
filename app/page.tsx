'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Language } from '@/types'

const STORAGE_KEY = 'serasa_lang'
const PRIMARY = '#FF6B35'

const LANGUAGES: {
  code: Language; flag: string; native: string; greeting: string; dir: 'ltr' | 'rtl'
}[] = [
  { code: 'id', flag: '🇮🇩', native: 'Bahasa Indonesia', greeting: 'Selamat Datang!', dir: 'ltr' },
  { code: 'en', flag: '🇬🇧', native: 'English',          greeting: 'Welcome!',         dir: 'ltr' },
  { code: 'ar', flag: '🇸🇦', native: 'العربية',           greeting: 'أهلاً وسهلاً!',    dir: 'rtl' },
]

export default function LanguageSelectionPage() {
  const router = useRouter()
  const [tableNumber, setTableNumber] = useState('1')
  const [selecting, setSelecting]     = useState<Language | null>(null)
  const [mounted, setMounted]         = useState(false)

  useEffect(() => {
    setMounted(true)
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
  }, [])

  function selectLanguage(lang: Language) {
    if (selecting) return
    setSelecting(lang)
    try { localStorage.setItem(STORAGE_KEY, lang) } catch {}
    setTimeout(() => router.push(`/menu?table=${tableNumber}`), 300)
  }

  if (!mounted) return null

  return (
    <div className="min-h-dvh bg-[#FAFAFA] flex flex-col items-center justify-center px-5 py-10">

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-2"
      >
        <div className="relative w-[200px] h-[72px]">
          <Image src="/logo.png" alt="Serasa Restaurant" fill className="object-contain" priority sizes="200px" />
        </div>
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-gray-400 text-[11px] tracking-[3px] uppercase mb-10"
      >
        from indonesia for the world
      </motion.p>

      {/* Table badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex items-center gap-2 px-4 py-2 rounded-full border mb-8"
        style={{ background: '#FFF3EE', borderColor: '#FFD5C4' }}
      >
        <span className="text-xs font-medium" style={{ color: PRIMARY }}>
          🪑 Meja / Table / طاولة
        </span>
        <span className="font-black text-sm" style={{ color: PRIMARY }}>{tableNumber}</span>
      </motion.div>

      {/* Divider */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="flex items-center gap-3 w-full max-w-sm mb-5"
      >
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-gray-400 text-[10px] tracking-[4px] uppercase">Pilih Bahasa</span>
        <div className="flex-1 h-px bg-gray-200" />
      </motion.div>

      {/* Language cards */}
      <div className="w-full max-w-sm space-y-3">
        {LANGUAGES.map((lang, idx) => {
          const isSelecting = selecting === lang.code
          return (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              whileTap={{ scale: 0.97 }}
              onClick={() => selectLanguage(lang.code)}
              disabled={!!selecting}
              dir={lang.dir}
              className="w-full"
            >
              <div
                className="flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-200"
                style={{
                  background: isSelecting ? '#FFF3EE' : 'white',
                  borderColor: isSelecting ? PRIMARY : '#F3F4F6',
                  boxShadow: isSelecting
                    ? `0 4px 20px rgba(255,107,53,0.15)`
                    : '0 2px 12px rgba(0,0,0,0.05)',
                }}
              >
                <span className="text-3xl leading-none flex-shrink-0">{lang.flag}</span>

                <div className={`flex-1 ${lang.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                  <p className="text-gray-900 font-bold text-base leading-tight"
                    style={{ fontFamily: lang.code === 'ar' ? 'var(--font-noto-arabic), serif' : undefined }}>
                    {lang.native}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5"
                    style={{ fontFamily: lang.code === 'ar' ? 'var(--font-noto-arabic), serif' : undefined }}>
                    {lang.greeting}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {isSelecting ? (
                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: PRIMARY, borderTopColor: 'transparent' }} />
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: '#FFF3EE' }}>
                      <ChevronRight size={14} style={{ color: PRIMARY }} />
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-gray-300 text-[10px] mt-10"
      >
        Serasa Indonesian Restaurant · Saudi Arabia
      </motion.p>
    </div>
  )
}
