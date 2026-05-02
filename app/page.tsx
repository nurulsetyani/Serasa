'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronRight, Utensils, Globe, X } from 'lucide-react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Language } from '@/types'

const STORAGE_KEY = 'serasa_lang'

const LANGUAGES: {
  code: Language; flag: string; native: string; greeting: string; dir: 'ltr' | 'rtl'
}[] = [
  { code: 'id', flag: '🇮🇩', native: 'Bahasa Indonesia', greeting: 'Selamat Datang!',  dir: 'ltr' },
  { code: 'en', flag: '🇬🇧', native: 'English',          greeting: 'Welcome!',          dir: 'ltr' },
  { code: 'ar', flag: '🇸🇦', native: 'العربية',           greeting: 'أهلاً وسهلاً!',     dir: 'rtl' },
]

const START_LABEL: Record<Language, string> = {
  id: 'Mulai Pesan',
  en: 'Start Ordering',
  ar: 'ابدأ الطلب',
}
const CHANGE_LANG_LABEL: Record<Language, string> = {
  id: 'Ganti Bahasa',
  en: 'Change Language',
  ar: 'تغيير اللغة',
}
const TABLE_LABEL: Record<Language, string> = {
  id: 'Meja', en: 'Table', ar: 'طاولة',
}

function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const nav = navigator.language.toLowerCase()
  if (nav.startsWith('ar')) return 'ar'
  if (nav.startsWith('id') || nav.startsWith('ms')) return 'id'
  return 'en'
}

// ── Language Bottom Sheet ──────────────────────────────────
function LanguageSheet({
  isOpen, onClose, onSelect, current,
}: {
  isOpen: boolean; onClose: () => void; onSelect: (l: Language) => void; current: Language
}) {
  const y = useMotionValue(0)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            drag="y" dragConstraints={{ top: 0 }} dragElastic={0.12}
            onDragEnd={(_, info) => { if (info.offset.y > 80) onClose() }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px] overflow-hidden"
            style={{ background: '#111111', boxShadow: '0 -8px 40px rgba(0,0,0,0.7)', y }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3.5 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-[#D4AF37]" />
                <span className="text-white font-semibold text-base">Select Language</span>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Options */}
            <div className="px-5 pb-8 space-y-3">
              {LANGUAGES.map(lang => (
                <motion.button
                  key={lang.code}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelect(lang.code)}
                  dir={lang.dir}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-200"
                  style={{
                    background: current === lang.code ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.04)',
                    borderColor: current === lang.code ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.07)',
                  }}
                >
                  <span className="text-3xl leading-none flex-shrink-0">{lang.flag}</span>
                  <div className={`flex-1 ${lang.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                    <p className="text-white font-semibold text-[15px] leading-tight"
                      style={{ fontFamily: lang.code === 'ar' ? 'var(--font-noto-arabic), serif' : undefined }}>
                      {lang.native}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5"
                      style={{ fontFamily: lang.code === 'ar' ? 'var(--font-noto-arabic), serif' : undefined }}>
                      {lang.greeting}
                    </p>
                  </div>
                  {current === lang.code && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#D4AF37' }}>
                      <span className="text-[10px] text-black font-black">✓</span>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function EntryPage() {
  const router = useRouter()
  const [tableNumber, setTableNumber] = useState('1')
  const [lang, setLang]               = useState<Language>('en')
  const [mounted, setMounted]         = useState(false)
  const [sheetOpen, setSheetOpen]     = useState(false)
  const [starting, setStarting]       = useState(false)

  useEffect(() => {
    setMounted(true)
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')

    // Auto-detect language
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null
      const resolved = saved ?? detectLanguage()
      setLang(resolved)
    } catch {}
  }, [])

  function selectLanguage(selected: Language) {
    setLang(selected)
    try { localStorage.setItem(STORAGE_KEY, selected) } catch {}
    setSheetOpen(false)
  }

  function handleStart() {
    if (starting) return
    setStarting(true)
    try { localStorage.setItem(STORAGE_KEY, lang) } catch {}
    setTimeout(() => router.push(`/menu?table=${tableNumber}`), 250)
  }

  if (!mounted) return null

  const isRTL = lang === 'ar'

  return (
    <div className="relative min-h-dvh bg-[#080604] overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── HERO SECTION (top 62%) ── */}
      <div className="absolute inset-0 z-0">

        {/* Food background — replace /hero-food.jpg with real food photo */}
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 120% 80% at 50% -10%, rgba(180,80,20,0.55) 0%, transparent 65%),
              radial-gradient(ellipse 80% 60% at 20% 60%, rgba(120,40,10,0.3) 0%, transparent 60%),
              radial-gradient(ellipse 60% 50% at 80% 40%, rgba(212,175,55,0.12) 0%, transparent 55%),
              linear-gradient(to bottom, #1a0c05 0%, #0d0804 40%, #08060a 100%)
            `,
          }}
        />

        {/* Grain texture */}
        <div className="absolute inset-0 opacity-[0.22] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Warm radial glow center */}
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(194,75,42,0.18) 0%, transparent 70%)' }} />

        {/* Bottom fade to content area */}
        <div className="absolute bottom-0 left-0 right-0 h-[55%]"
          style={{ background: 'linear-gradient(to top, #080604 30%, transparent 100%)' }} />
      </div>

      {/* ── LOGO + TAGLINE ── */}
      <div className="relative z-10 flex flex-col items-center pt-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Glow behind logo */}
          <div className="absolute inset-0 -m-6 rounded-full blur-2xl opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.4), transparent 70%)' }} />

          <div className="relative w-[200px] h-[74px]">
            <Image
              src="/logo.png"
              alt="Serasa Restaurant"
              fill
              className="object-contain drop-shadow-[0_4px_32px_rgba(194,75,42,0.5)]"
              priority
              sizes="200px"
            />
          </div>
        </motion.div>

        {/* Food visual — decorative food emojis with blur/glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 relative"
        >
          {/* Center dish */}
          <div className="relative flex items-center justify-center">
            <div className="text-[90px] leading-none select-none"
              style={{ filter: 'drop-shadow(0 8px 40px rgba(194,75,42,0.6)) drop-shadow(0 0 60px rgba(212,175,55,0.3))' }}>
              🍛
            </div>
            {/* Ring glow */}
            <div className="absolute w-36 h-36 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.15), transparent 70%)' }} />
          </div>

          {/* Floating side dishes */}
          {[
            { emoji: '🥘', x: -80, y: 20, delay: 0.4, size: 42 },
            { emoji: '🍜', x: 80,  y: 20, delay: 0.5, size: 42 },
            { emoji: '🥩', x: -55, y: 72, delay: 0.6, size: 34 },
            { emoji: '🥤', x: 55,  y: 72, delay: 0.7, size: 34 },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.6 }}
              animate={{ opacity: 0.7, y: 0, scale: 1 }}
              transition={{ delay: item.delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="absolute select-none pointer-events-none"
              style={{
                left: `calc(50% + ${item.x}px)`,
                top: item.y,
                fontSize: item.size,
                lineHeight: 1,
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
              }}
            >
              {item.emoji}
            </motion.div>
          ))}
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-10 text-center"
        >
          <p className="text-white/30 text-[10px] tracking-[4px] uppercase">
            from indonesia · for the world
          </p>
        </motion.div>
      </div>

      {/* ── BOTTOM CONTENT CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mt-10 px-5 pb-10"
      >
        {/* Table badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{ background: 'rgba(212,175,55,0.08)', borderColor: 'rgba(212,175,55,0.2)' }}>
            <Utensils size={12} style={{ color: '#D4AF37' }} />
            <span className="text-[11px] font-semibold" style={{ color: 'rgba(212,175,55,0.8)' }}>
              {TABLE_LABEL[lang]} {tableNumber}
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-8">
          <h1 className="text-white font-bold text-[26px] leading-tight tracking-tight mb-2">
            {lang === 'id' ? 'Cita Rasa Indonesia' :
             lang === 'ar' ? 'نكهات إندونيسيا الأصيلة' :
             'Authentic Indonesian Flavors'}
          </h1>
          <p className="text-white/40 text-sm">
            {lang === 'id' ? 'Langsung pesan dari meja Anda' :
             lang === 'ar' ? 'اطلب مباشرة من طاولتك' :
             'Order directly from your table'}
          </p>
        </div>

        {/* START ORDERING BUTTON */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleStart}
          disabled={starting}
          className="w-full relative overflow-hidden rounded-2xl py-5 flex items-center justify-between px-6 font-black text-lg"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #F0CC55 45%, #B8960C 100%)',
            boxShadow: '0 8px 40px rgba(212,175,55,0.5), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            color: '#0A0806',
          }}
        >
          {/* shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
            style={{ animation: 'shimmer 2.5s linear infinite', backgroundSize: '200% 100%' }} />

          <span>{starting ? '...' : START_LABEL[lang]}</span>

          <div className="flex items-center gap-1.5 bg-black/15 rounded-xl px-3 py-2">
            <Utensils size={15} />
            <ChevronRight size={15} strokeWidth={2.5} />
          </div>
        </motion.button>

        {/* Change language */}
        <div className="flex justify-center mt-5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="text-base leading-none">
              {LANGUAGES.find(l => l.code === lang)?.flag}
            </span>
            <span className="text-white/40 text-xs font-medium">{CHANGE_LANG_LABEL[lang]}</span>
            <Globe size={12} className="text-white/25" />
          </motion.button>
        </div>
      </motion.div>

      {/* ── LANGUAGE BOTTOM SHEET ── */}
      <LanguageSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelect={selectLanguage}
        current={lang}
      />

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
