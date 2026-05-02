'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronRight, Globe, X, Utensils } from 'lucide-react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { Language } from '@/types'

const STORAGE_KEY = 'serasa_lang'

type LangConfig = { code: Language; flag: string; native: string; greeting: string; dir: 'ltr' | 'rtl' }

const LANGUAGES: LangConfig[] = [
  { code: 'id', flag: '🇮🇩', native: 'Bahasa Indonesia', greeting: 'Selamat Datang!', dir: 'ltr' },
  { code: 'en', flag: '🇬🇧', native: 'English',          greeting: 'Welcome!',         dir: 'ltr' },
  { code: 'ar', flag: '🇸🇦', native: 'العربية',           greeting: 'أهلاً وسهلاً!',    dir: 'rtl' },
]

const COPY = {
  headline: { id: 'Cita Rasa Nusantara', en: 'The Taste of Indonesia', ar: 'نكهات إندونيسيا الأصيلة' },
  sub:      { id: 'Langsung pesan dari meja Anda', en: 'Order directly from your table', ar: 'اطلب مباشرة من طاولتك' },
  cta:      { id: 'Mulai Pesan', en: 'Start Ordering', ar: 'ابدأ الطلب' },
  table:    { id: 'Meja', en: 'Table', ar: 'طاولة' },
  change:   { id: 'Ganti Bahasa', en: 'Change Language', ar: 'تغيير اللغة' },
  halal:    { id: 'Halal • Segar Setiap Hari', en: 'Halal • Fresh Daily', ar: 'حلال • طازج يومياً' },
}

function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const nav = navigator.language.toLowerCase()
  if (nav.startsWith('ar')) return 'ar'
  if (nav.startsWith('id') || nav.startsWith('ms')) return 'id'
  return 'en'
}

// ── Language Bottom Sheet ─────────────────────────────────
function LangSheet({ isOpen, onClose, onSelect, current }: {
  isOpen: boolean; onClose: () => void; onSelect: (l: Language) => void; current: Language
}) {
  const y = useMotionValue(0)
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            drag="y" dragConstraints={{ top: 0 }} dragElastic={0.1}
            onDragEnd={(_, i) => { if (i.offset.y > 80) onClose() }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px]"
            style={{ boxShadow: '0 -12px 48px rgba(0,0,0,0.14)', y }}
          >
            <div className="flex justify-center pt-3.5 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <p className="font-bold text-gray-900 text-base">Select Language</p>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={15} />
              </button>
            </div>
            <div className="px-5 pb-10 space-y-3">
              {LANGUAGES.map(lang => (
                <motion.button key={lang.code} whileTap={{ scale: 0.97 }}
                  onClick={() => onSelect(lang.code)} dir={lang.dir}
                  className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all"
                  style={{
                    background: current === lang.code ? '#FFF3EE' : '#FAFAFA',
                    borderColor: current === lang.code ? '#C24B2A' : '#F0EDE8',
                  }}>
                  <span className="text-3xl leading-none flex-shrink-0">{lang.flag}</span>
                  <div className={`flex-1 ${lang.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                    <p className="text-gray-900 font-bold text-[15px]"
                      style={{ fontFamily: lang.code === 'ar' ? 'var(--font-noto-arabic),serif' : undefined }}>
                      {lang.native}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">{lang.greeting}</p>
                  </div>
                  {current === lang.code && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#C24B2A' }}>
                      <span className="text-white text-[11px] font-black">✓</span>
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

// ── Main Page ─────────────────────────────────────────────
export default function EntryPage() {
  const router = useRouter()
  const [tableNumber, setTableNumber] = useState('1')
  const [lang, setLang]               = useState<Language>('en')
  const [mounted, setMounted]         = useState(false)
  const [sheetOpen, setSheetOpen]     = useState(false)
  const [starting, setStarting]       = useState(false)
  const [heroImage, setHeroImage]     = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null
      setLang(saved ?? detectLanguage())
    } catch {}

    // Pull best-seller image from menu API for hero
    fetch('/api/menu').then(r => r.json()).then((items: { image?: string; is_best_seller?: boolean }[]) => {
      const hero = items.find(i => i.is_best_seller && i.image && !i.image.includes('placehold'))
        ?? items.find(i => i.image && !i.image.includes('placehold'))
      if (hero?.image) setHeroImage(hero.image)
    }).catch(() => {})
  }, [])

  function selectLanguage(l: Language) {
    setLang(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch {}
    setSheetOpen(false)
  }

  function handleStart() {
    if (starting) return
    setStarting(true)
    try { localStorage.setItem(STORAGE_KEY, lang) } catch {}
    setTimeout(() => router.push(`/menu?table=${tableNumber}`), 220)
  }

  if (!mounted) return null
  const isRTL = lang === 'ar'
  const currentLang = LANGUAGES.find(l => l.code === lang)!

  return (
    <div className="relative min-h-dvh overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: '#FFFAF5' }}>

      {/* ═══════════════════════════════════════
          HERO — top 62%
      ═══════════════════════════════════════ */}
      <div className="relative h-[62dvh] overflow-hidden">

        {/* Food photo or warm gradient fallback */}
        {heroImage ? (
          <Image src={heroImage} alt="Serasa food" fill className="object-cover scale-105"
            style={{ filter: 'saturate(1.15) brightness(0.88)' }} priority sizes="100vw" />
        ) : (
          <div className="absolute inset-0" style={{
            background: `
              radial-gradient(ellipse 100% 70% at 30% 40%, rgba(200,90,30,0.55), transparent 65%),
              radial-gradient(ellipse 80% 60% at 80% 70%, rgba(212,175,55,0.3), transparent 60%),
              radial-gradient(ellipse 60% 80% at 10% 80%, rgba(140,60,10,0.35), transparent 55%),
              linear-gradient(160deg, #2a1206 0%, #1a0c05 40%, #0e0a08 100%)
            `,
          }}>
            {/* Large decorative food emoji stack */}
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ transform: 'translateY(-5%)' }}>
              <div className="relative">
                <div className="text-[130px] leading-none select-none"
                  style={{ filter: 'drop-shadow(0 16px 60px rgba(180,70,10,0.7)) drop-shadow(0 0 80px rgba(212,175,55,0.4))' }}>
                  🍛
                </div>
                {[
                  { e: '🥘', x: -110, y: -10, s: 56, o: 0.75, d: 0.15 },
                  { e: '🍜', x: 110,  y: -10, s: 56, o: 0.75, d: 0.2  },
                  { e: '🥩', x: -70,  y: 85,  s: 44, o: 0.55, d: 0.3  },
                  { e: '🫕', x: 70,   y: 85,  s: 44, o: 0.55, d: 0.35 },
                  { e: '🥥', x: -130, y: 75,  s: 36, o: 0.4,  d: 0.4  },
                  { e: '🌶️', x: 125,  y: 70,  s: 36, o: 0.4,  d: 0.45 },
                ].map((item, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: item.o, scale: 1 }}
                    transition={{ delay: item.d, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute select-none pointer-events-none leading-none"
                    style={{
                      fontSize: item.s, left: `calc(50% + ${item.x}px)`,
                      top: item.y, transform: 'translateX(-50%)',
                      filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.5))',
                    }}>
                    {item.e}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cinematic overlays */}
        {/* Top vignette */}
        <div className="absolute inset-x-0 top-0 h-32"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)' }} />
        {/* Bottom fade to content */}
        <div className="absolute inset-x-0 bottom-0 h-48"
          style={{ background: 'linear-gradient(to top, #FFFAF5 0%, rgba(255,250,245,0.5) 60%, transparent 100%)' }} />
        {/* Subtle warm tone wash */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(194,75,42,0.08) 0%, transparent 50%, rgba(212,175,55,0.06) 100%)' }} />

        {/* Logo — centered on hero */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-10 left-0 right-0 flex flex-col items-center"
        >
          <div className="relative w-[180px] h-[64px]"
            style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5)) brightness(1.08)' }}>
            <Image src="/logo.png" alt="Serasa" fill className="object-contain" priority sizes="180px" />
          </div>
        </motion.div>

        {/* Table badge — bottom left of hero */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="absolute bottom-14 left-5"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
            <Utensils size={10} className="text-white/80" />
            <span className="text-white/90 text-[10px] font-semibold tracking-wide">
              {COPY.table[lang]} {tableNumber}
            </span>
          </div>
        </motion.div>

        {/* Halal badge — bottom right of hero */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="absolute bottom-14 right-5"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md"
            style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.35)' }}>
            <span className="text-[10px] font-bold" style={{ color: '#D4AF37' }}>
              {COPY.halal[lang]}
            </span>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════
          CONTENT PANEL — bottom
      ═══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 px-6 pt-2 pb-10"
      >
        {/* Headline */}
        <div className="mb-6">
          <motion.h1
            key={lang}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-display leading-tight mb-2"
            style={{
              fontSize: 'clamp(28px, 7vw, 36px)',
              color: '#1A0E08',
              letterSpacing: '-0.025em',
              fontFamily: lang === 'ar' ? 'var(--font-noto-arabic),serif' : undefined,
            }}
          >
            {COPY.headline[lang]}
          </motion.h1>
          <motion.p
            key={`sub-${lang}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-[15px] leading-relaxed"
            style={{ color: '#8A6A5A', fontFamily: lang === 'ar' ? 'var(--font-noto-arabic),serif' : undefined }}
          >
            {COPY.sub[lang]}
          </motion.p>
        </div>

        {/* Flavour tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="flex gap-2 flex-wrap mb-8"
          style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
        >
          {[
            { label: lang === 'ar' ? 'رندانق' : lang === 'id' ? 'Rendang' : 'Rendang', color: '#C24B2A' },
            { label: lang === 'ar' ? 'ناسي غورينج' : lang === 'id' ? 'Nasi Goreng' : 'Nasi Goreng', color: '#B87D2A' },
            { label: lang === 'ar' ? 'ساتيه' : lang === 'id' ? 'Sate Ayam' : 'Sate Ayam', color: '#4A7C3F' },
            { label: lang === 'ar' ? 'ميي غورينج' : lang === 'id' ? 'Mie Goreng' : 'Mie Goreng', color: '#7A5230' },
          ].map(tag => (
            <span key={tag.label}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
              style={{ background: `${tag.color}12`, color: tag.color, border: `1px solid ${tag.color}22` }}>
              {tag.label}
            </span>
          ))}
        </motion.div>

        {/* ── START ORDERING BUTTON ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleStart}
            disabled={starting}
            className="w-full relative overflow-hidden rounded-2xl flex items-center justify-between px-6 py-5"
            style={{
              background: 'linear-gradient(135deg, #C24B2A 0%, #E06A40 40%, #A83820 100%)',
              boxShadow: '0 8px 32px rgba(194,75,42,0.45), 0 2px 8px rgba(194,75,42,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            {/* shimmer sweep */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', repeatDelay: 1.2 }}
            />
            <span className="relative font-black text-white text-[17px] tracking-tight"
              style={{ fontFamily: lang === 'ar' ? 'var(--font-noto-arabic),serif' : undefined }}>
              {starting ? '...' : COPY.cta[lang]}
            </span>
            <div className="relative flex items-center gap-1 bg-white/15 rounded-xl px-3.5 py-2">
              <Utensils size={14} className="text-white" />
              <ChevronRight size={14} className="text-white" strokeWidth={2.5} />
            </div>
          </motion.button>
        </motion.div>

        {/* ── CHANGE LANGUAGE ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="flex justify-center mt-5"
        >
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all active:scale-95"
            style={{ background: '#F5EDE6', border: '1px solid #EAD8CC' }}
          >
            <span className="text-base leading-none">{currentLang.flag}</span>
            <span className="text-[12px] font-medium" style={{ color: '#8A6A5A' }}>
              {COPY.change[lang]}
            </span>
            <Globe size={12} style={{ color: '#B8956A' }} />
          </button>
        </motion.div>

        {/* Divider + footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center gap-3 mt-8"
        >
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #E8D8CC)' }} />
          <span className="text-[10px] tracking-[3px] uppercase" style={{ color: '#C4A898' }}>
            Saudi Arabia
          </span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, #E8D8CC)' }} />
        </motion.div>
      </motion.div>

      {/* ── LANGUAGE SHEET ── */}
      <LangSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)}
        onSelect={selectLanguage} current={lang} />
    </div>
  )
}
