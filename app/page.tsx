'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronRight, Globe, X } from 'lucide-react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { Language } from '@/types'

const STORAGE_KEY = 'serasa_lang'
const P = '#FF6B35'
const GOLD = '#C9924A'

type LangCfg = { code: Language; flag: string; native: string; greeting: string; dir: 'ltr' | 'rtl' }

const LANGUAGES: LangCfg[] = [
  { code: 'en', flag: '🇬🇧', native: 'English',          greeting: 'Welcome',        dir: 'ltr' },
  { code: 'id', flag: '🇮🇩', native: 'Bahasa Indonesia', greeting: 'Selamat Datang', dir: 'ltr' },
  { code: 'ar', flag: '🇸🇦', native: 'العربية',           greeting: 'أهلاً وسهلاً',   dir: 'rtl' },
]

const GREETING:     Record<Language, string> = { id: 'Selamat Datang', en: 'Welcome',           ar: 'أهلاً وسهلاً'  }
const TAGLINE:      Record<Language, string> = { id: 'Dari Indonesia untuk dunia', en: 'From Indonesia, with love', ar: 'من إندونيسيا بكل محبة' }
const CTA:          Record<Language, string> = { id: 'Mulai Memesan',  en: 'Begin Your Journey', ar: 'ابدأ رحلتك'   }
const CHANGE_LANG:  Record<Language, string> = { id: 'Ganti Bahasa',   en: 'Language',           ar: 'اللغة'        }
const SELECT_LANG:  Record<Language, string> = { id: 'Pilih Bahasa',   en: 'Select Language',    ar: 'اختر اللغة'   }

function detectLang(): Language {
  if (typeof window === 'undefined') return 'en'
  const nav = navigator.language.toLowerCase()
  if (nav.startsWith('ar')) return 'ar'
  if (nav.startsWith('id') || nav.startsWith('ms')) return 'id'
  return 'en'
}

// ── Language bottom sheet ─────────────────────────────────────────────────
function LangSheet({ open, onClose, onSelect, current }: {
  open: boolean; onClose: () => void; onSelect: (l: Language) => void; current: Language
}) {
  const y = useMotionValue(0)
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            drag="y" dragConstraints={{ top: 0 }} dragElastic={0.08}
            onDragEnd={(_, i) => { if (i.offset.y > 80) onClose() }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px]"
            style={{ background: '#141210', boxShadow: '0 -2px 60px rgba(0,0,0,0.8)', y }}
          >
            {/* Drag pill */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>

            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="font-bold text-xl" style={{ color: '#F0E8DC', fontFamily: "'Outfit', sans-serif" }}>
                {SELECT_LANG[current]}
              </h2>
              <button onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}>
                <X size={15} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>

            <div className="px-5 pb-12 space-y-3">
              {LANGUAGES.map(l => {
                const active = l.code === current
                return (
                  <motion.button key={l.code} whileTap={{ scale: 0.97 }}
                    onClick={() => onSelect(l.code)} dir={l.dir}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all"
                    style={{
                      background: active ? 'rgba(201,146,74,0.12)' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${active ? GOLD : 'rgba(255,255,255,0.08)'}`,
                    }}>
                    <span className="text-3xl leading-none flex-shrink-0">{l.flag}</span>
                    <div className={`flex-1 ${l.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      <p className="font-bold text-[16px]"
                        style={{
                          color: active ? GOLD : '#F0E8DC',
                          fontFamily: l.code === 'ar' ? 'var(--font-noto-arabic),serif' : "'Outfit', sans-serif",
                        }}>
                        {l.native}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{l.greeting}</p>
                    </div>
                    <motion.div
                      animate={{ scale: active ? 1 : 0.85, opacity: active ? 1 : 0.4 }}
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: active ? GOLD : 'rgba(255,255,255,0.2)', background: active ? GOLD : 'transparent' }}>
                      {active && <div className="w-2 h-2 bg-white rounded-full" />}
                    </motion.div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Ambient floating particle ─────────────────────────────────────────────
function Particle({ x, y, size, delay, duration }: {
  x: number; y: number; size: number; delay: number; duration: number
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size,
        background: `radial-gradient(circle, rgba(201,146,74,0.35) 0%, transparent 70%)` }}
      animate={{ y: [-6, 6, -6], opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────
export default function EntryPage() {
  const router = useRouter()
  const [table, setTable]     = useState('1')
  const [lang, setLang]       = useState<Language>('en')
  const [mounted, setMounted] = useState(false)
  const [sheet, setSheet]     = useState(false)
  const [going, setGoing]     = useState(false)
  const [heroImg, setHeroImg] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const p = new URLSearchParams(window.location.search)
    setTable(p.get('table') ?? '1')
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null
      setLang(saved ?? detectLang())
    } catch {}
    fetch('/api/menu').then(r => r.json())
      .then((items: { image?: string; is_best_seller?: boolean }[]) => {
        const hit = items.find(i => i.is_best_seller && i.image && !i.image.includes('placehold'))
          ?? items.find(i => i.image && !i.image.includes('placehold'))
        if (hit?.image) setHeroImg(hit.image)
      }).catch(() => {})
  }, [])

  function selectLang(l: Language) {
    setLang(l); try { localStorage.setItem(STORAGE_KEY, l) } catch {}; setSheet(false)
  }
  function start() {
    if (going) return; setGoing(true)
    try { localStorage.setItem(STORAGE_KEY, lang) } catch {}
    setTimeout(() => router.push(`/menu?table=${table}`), 220)
  }

  if (!mounted) return null
  const isRTL = lang === 'ar'

  return (
    <div
      className="min-h-dvh overflow-hidden relative select-none"
      style={{ background: '#0C0A08', fontFamily: "'Outfit', sans-serif" }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ── Google Fonts ─────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;1,9..144,300;1,9..144,600&family=Outfit:wght@300;400;500;600;700;800&display=swap');

        @keyframes grain {
          0%, 100% { transform: translate(0, 0) }
          10%  { transform: translate(-2%, -2%) }
          20%  { transform: translate(2%, 2%) }
          30%  { transform: translate(-1%, 1%) }
          40%  { transform: translate(1%, -1%) }
          50%  { transform: translate(-2%, 2%) }
          60%  { transform: translate(2%, -2%) }
          70%  { transform: translate(-1%, -1%) }
          80%  { transform: translate(1%, 1%) }
          90%  { transform: translate(-2%, -1%) }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-120%) }
          100% { transform: translateX(220%) }
        }
        .cta-shimmer { animation: shimmer 3.2s ease-in-out infinite; animation-delay: 0.8s; }
      `}</style>

      {/* ── SVG GRAIN overlay ──────────────────────────────────────────── */}
      <div className="fixed inset-0 z-10 pointer-events-none" style={{ opacity: 0.028 }}>
        <svg width="100%" height="100%">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </div>

      {/* ── HERO — cinematic food stage ──────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: '62dvh', background: '#0C0A08' }}>

        {/* Food image — floating, slightly pulled back */}
        <motion.div
          className="absolute inset-0"
          style={{ scale: 0.92 }}  /* breathing room — shows dark bg at edges */
          animate={{ y: [0, -10, 0], scale: [0.92, 0.93, 0.92] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Image
            src={heroImg || '/hero-food.png'}
            alt="Indonesian cuisine" fill priority
            className="object-cover object-center"
            style={{ filter: 'brightness(0.88) saturate(1.18) contrast(1.04)' }}
            sizes="100vw"
          />
        </motion.div>

        {/* Cinematic gradient — dark edges, preserves food centre */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `
            linear-gradient(180deg,
              rgba(12,10,8,0.60) 0%,
              rgba(12,10,8,0.20) 25%,
              rgba(12,10,8,0.10) 45%,
              rgba(12,10,8,0.45) 70%,
              rgba(12,10,8,0.92) 90%,
              #0C0A08 100%
            ),
            radial-gradient(ellipse 80% 60% at 50% 30%, transparent 40%, rgba(12,10,8,0.30) 100%)
          `,
        }} />

        {/* Subtle vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 50%, rgba(12,10,8,0.45) 100%)',
        }} />

        {/* ── LOGO — glass pill ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-8 left-0 right-0 flex justify-center z-20"
        >
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              borderRadius: 100,
              padding: '10px 28px',
              border: '1px solid rgba(255,255,255,0.14)',
              boxShadow: `
                0 4px 32px rgba(0,0,0,0.4),
                0 1px 0 rgba(255,255,255,0.12) inset,
                0 0 48px rgba(201,146,74,0.06)
              `,
            }}
          >
            <div style={{ position: 'relative', width: 160, height: 58 }}>
              <Image src="/logof22.png" alt="Serasa" fill className="object-contain" priority sizes="160px"
                style={{ filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.5)) brightness(1.05)' }} />
            </div>
          </motion.div>
        </motion.div>

        {/* Ambient warm glow behind logo */}
        <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none" style={{ height: 140 }}>
          <div style={{
            width: 280, height: 80, marginTop: 20,
            background: `radial-gradient(ellipse, rgba(201,146,74,0.10) 0%, transparent 70%)`,
            filter: 'blur(24px)',
          }} />
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────── */}
      <div className="relative px-6 pt-6 pb-16 flex flex-col items-center text-center" style={{ zIndex: 2 }}>

        {/* Ambient radial glow — warm from below food */}
        <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ height: 160 }}>
          <div style={{
            position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
            width: '120%', height: 160,
            background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(255,107,53,0.08) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }} />
        </div>

        {/* Floating ambient particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Particle x={12} y={8}  size={4} delay={0}   duration={7} />
          <Particle x={85} y={15} size={3} delay={1.5} duration={9} />
          <Particle x={22} y={40} size={2} delay={3}   duration={11} />
          <Particle x={75} y={55} size={4} delay={0.8} duration={8} />
          <Particle x={50} y={72} size={2} delay={2.2} duration={10} />
          <Particle x={90} y={80} size={3} delay={4}   duration={7.5} />
        </div>

        {/* TAGLINE */}
        <motion.p
          key={`tag-${lang}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 500,
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: GOLD,
            marginBottom: 10,
          }}
        >
          {TAGLINE[lang]}
        </motion.p>

        {/* GREETING — cinematic serif */}
        <motion.h1
          key={`h-${lang}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: isRTL ? 'var(--font-noto-arabic),serif' : "'Fraunces', serif",
            fontWeight: isRTL ? 700 : 300,
            fontStyle: isRTL ? 'normal' : 'italic',
            fontSize: isRTL ? 'clamp(36px, 10vw, 52px)' : 'clamp(44px, 12vw, 62px)',
            color: '#F0E6D6',
            letterSpacing: isRTL ? '0.02em' : '-0.02em',
            lineHeight: 1.0,
            marginBottom: 14,
          }}
        >
          {GREETING[lang]}
        </motion.h1>

        {/* Decorative rule */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: 48, height: 1,
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
            marginBottom: 14,
          }}
        />

        {/* Table + location */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13, fontWeight: 400,
            color: 'rgba(240,230,214,0.35)',
            letterSpacing: '0.05em',
            marginBottom: 36,
          }}
        >
          {isRTL ? `طاولة #${table}` : `Table #${table}`} · Mekkah, KSA
        </motion.p>

        {/* ── CTA button ── */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          whileTap={{ scale: 0.97 }}
          onClick={start}
          disabled={going}
          className="w-full relative overflow-hidden rounded-full flex items-center justify-between px-7 disabled:opacity-60"
          style={{
            paddingTop: 19, paddingBottom: 19,
            background: `linear-gradient(135deg, #FF7A45 0%, ${P} 45%, #E85E1E 100%)`,
            boxShadow: `
              0 0 0 1px rgba(255,107,53,0.3),
              0 8px 32px rgba(255,107,53,0.38),
              0 2px 8px rgba(255,107,53,0.25),
              inset 0 1px 0 rgba(255,255,255,0.20)
            `,
          }}
        >
          {/* Shimmer */}
          <div
            className="cta-shimmer absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.16) 50%, transparent 65%)' }}
          />
          <span
            className="font-bold text-[17px] text-white relative z-10"
            style={{
              fontFamily: isRTL ? 'var(--font-noto-arabic),serif' : "'Outfit', sans-serif",
              letterSpacing: isRTL ? '0.02em' : '0.01em',
            }}
          >
            {going ? '...' : CTA[lang]}
          </span>
          <motion.div
            animate={{ x: going ? 4 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="relative z-10"
          >
            <ChevronRight size={20} strokeWidth={2.5} className="text-white" />
          </motion.div>
        </motion.button>

        {/* ── Language switcher — premium pill ── */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setSheet(true)}
          className="flex items-center justify-center gap-2.5 mt-5"
          style={{
            padding: '10px 22px',
            borderRadius: 100,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Globe size={13} style={{ color: 'rgba(240,230,214,0.45)' }} />
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 11, fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(240,230,214,0.45)',
            }}
          >
            {CHANGE_LANG[lang]}
          </span>
        </motion.button>

        {/* ── Bottom atmospheric texture ── */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none" style={{ zIndex: -1 }}>
          {/* Subtle warm radial glow at bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', height: 120,
            background: 'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(201,146,74,0.04) 0%, transparent 70%)',
          }} />
          {/* Horizontal accent line */}
          <div style={{
            position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
            width: 100, height: 1,
            background: `linear-gradient(90deg, transparent, rgba(201,146,74,0.15), transparent)`,
          }} />
        </div>
      </div>

      <LangSheet open={sheet} onClose={() => setSheet(false)} onSelect={selectLang} current={lang} />
    </div>
  )
}
