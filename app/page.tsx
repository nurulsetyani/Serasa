'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronRight, Globe, X, Star, Zap, Leaf } from 'lucide-react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { Language } from '@/types'

const STORAGE_KEY = 'serasa_lang'
const P  = '#FF6B35'
const BG = '#F5F2EE'

type LangCfg = { code: Language; flag: string; native: string; label: string; greeting: string; dir: 'ltr' | 'rtl' }

const LANGUAGES: LangCfg[] = [
  { code: 'en', flag: '🇬🇧', native: 'English',          label: 'EN',  greeting: 'Welcome',        dir: 'ltr' },
  { code: 'id', flag: '🇮🇩', native: 'Bahasa Indonesia', label: 'ID',  greeting: 'Selamat Datang', dir: 'ltr' },
  { code: 'ar', flag: '🇸🇦', native: 'العربية',           label: 'عر', greeting: 'أهلاً وسهلاً',   dir: 'rtl' },
]

const GREETING:   Record<Language, string> = { id: 'Selamat Datang', en: 'Welcome',     ar: 'أهلاً وسهلاً' }
const TAGLINE:    Record<Language, string> = { id: 'Masakan Autentik Indonesia', en: 'Authentic Indonesian Cuisine', ar: 'مطبخ إندونيسي أصيل' }
const CTA:        Record<Language, string> = { id: 'Mulai Memesan',  en: 'Start Ordering', ar: 'ابدأ الطلب' }
const SELECT_LANG: Record<Language, string> = { id: 'Pilih Bahasa', en: 'Select Language', ar: 'اختر اللغة' }

const CHIPS: Record<Language, string[]> = {
  en: ['⭐ 4.9 Rating', 'Halal Certified', '⚡ Quick Ordering'],
  id: ['⭐ 4.9 Ulasan', 'Bersertifikat Halal', '⚡ Pesan Cepat'],
  ar: ['⭐ ٤.٩ تقييم', 'حلال معتمد', '⚡ طلب سريع'],
}

function detectLang(): Language {
  if (typeof window === 'undefined') return 'en'
  const n = navigator.language.toLowerCase()
  if (n.startsWith('ar')) return 'ar'
  if (n.startsWith('id') || n.startsWith('ms')) return 'id'
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
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="y" dragConstraints={{ top: 0 }} dragElastic={0.08}
            onDragEnd={(_, i) => { if (i.offset.y > 70) onClose() }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px]"
            style={{ background: '#FFFFFF', boxShadow: '0 -4px 50px rgba(0,0,0,0.10)', y }}
          >
            <div className="flex justify-center pt-3 pb-1.5">
              <div className="w-8 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center justify-between px-6 pt-1.5 pb-4">
              <h2 className="font-bold text-[18px] text-gray-900"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {SELECT_LANG[current]}
              </h2>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={14} className="text-gray-500" />
              </button>
            </div>
            <div className="px-5 pb-10 space-y-2.5">
              {LANGUAGES.map(l => {
                const active = l.code === current
                return (
                  <motion.button key={l.code} whileTap={{ scale: 0.975 }}
                    onClick={() => onSelect(l.code)} dir={l.dir}
                    className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl border-2 transition-colors"
                    style={{
                      background: active ? `${P}0D` : '#FAFAF8',
                      borderColor: active ? P : '#EDEAE5',
                    }}>
                    <span className="text-3xl leading-none flex-shrink-0">{l.flag}</span>
                    <div className={`flex-1 ${l.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      <p className="font-bold text-[15px]"
                        style={{
                          color: active ? P : '#1C1917',
                          fontFamily: l.code === 'ar' ? 'var(--font-noto-arabic),serif' : "'Bricolage Grotesque', sans-serif",
                        }}>
                        {l.native}
                      </p>
                      <p className="text-[13px] mt-0.5 text-stone-400">{l.greeting}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: active ? P : '#D1CDC7', background: active ? P : 'transparent' }}>
                      {active && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
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
    setTimeout(() => router.push(`/menu?table=${table}`), 200)
  }

  if (!mounted) return null
  const isRTL  = lang === 'ar'
  const chips  = CHIPS[lang]
  const curLang = LANGUAGES.find(l => l.code === lang)!

  return (
    // ── ROOT: single viewport, no overflow ──────────────────────────────
    <div
      className="overflow-hidden flex flex-col"
      style={{
        height: '100dvh',
        maxHeight: '100dvh',
        background: BG,
        fontFamily: "'DM Sans', sans-serif",
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        @keyframes float-hero {
          0%,100% { transform: scale(0.93) translateY(0px) }
          50%      { transform: scale(0.93) translateY(-6px) }
        }
        @keyframes cta-breathe {
          0%,100% { box-shadow: 0 6px 22px rgba(255,107,53,0.34), 0 2px 6px rgba(255,107,53,0.18), inset 0 1px 0 rgba(255,255,255,0.22) }
          50%      { box-shadow: 0 10px 30px rgba(255,107,53,0.44), 0 3px 10px rgba(255,107,53,0.24), inset 0 1px 0 rgba(255,255,255,0.22) }
        }
        @keyframes shimmer-cta {
          0%   { transform: translateX(-120%) }
          100% { transform: translateX(220%) }
        }
        .hero-float { animation: float-hero 11s ease-in-out infinite; }
        .cta-breathe { animation: cta-breathe 3s ease-in-out infinite; }
        .shimmer-cta { animation: shimmer-cta 3.6s ease-in-out infinite; animation-delay: 1s; }
        /* Hide scrollbar on chips row */
        .chips-row::-webkit-scrollbar { display: none; }
        .chips-row { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── HERO — compact 40dvh ────────────────────────────────────────── */}
      <div className="relative flex-shrink-0 overflow-hidden" style={{ height: '40dvh', background: '#1A1410' }}>

        {/* Food — floating, editorial pull-back */}
        <div className="absolute inset-0 hero-float" style={{ transformOrigin: 'center 45%' }}>
          <Image
            src={heroImg || '/hero-food.png'}
            alt="Indonesian cuisine" fill priority
            className="object-cover object-center"
            style={{ filter: 'brightness(0.88) saturate(1.14) contrast(1.04)' }}
            sizes="100vw"
          />
        </div>

        {/* Cinematic overlay — dark top + fades to cream at bottom */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(
            180deg,
            rgba(20,16,12,0.58) 0%,
            rgba(20,16,12,0.16) 28%,
            rgba(20,16,12,0.04) 50%,
            rgba(20,16,12,0.22) 68%,
            rgba(245,242,238,0.68) 86%,
            ${BG} 100%
          )`,
        }} />

        {/* ── LOGO — glassmorphism pill, tight top ── */}
        <motion.div
          initial={{ opacity: 0, y: -14, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-0 right-0 flex justify-center z-10"
          style={{ top: 'clamp(20px, 4dvh, 32px)' }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.11)',
            backdropFilter: 'blur(18px) saturate(160%)',
            WebkitBackdropFilter: 'blur(18px) saturate(160%)',
            borderRadius: 100,
            padding: '7px 22px',
            border: '1px solid rgba(255,255,255,0.20)',
            boxShadow: '0 3px 20px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.16)',
          }}>
            <div style={{ position: 'relative', width: 130, height: 46 }}>
              <Image src="/logof22.png" alt="Serasa" fill className="object-contain" priority sizes="130px"
                style={{ filter: 'brightness(1.06) drop-shadow(0 1px 8px rgba(0,0,0,0.30))' }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── CONTENT — fills remaining 60dvh ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 flex flex-col justify-between px-5 overflow-hidden"
        style={{ paddingTop: '3.5dvh', paddingBottom: 'clamp(12px, 3dvh, 24px)' }}
      >
        {/* Top group: chips + tagline + greeting + table */}
        <div className="flex flex-col items-center text-center">

          {/* Trust chips — SINGLE horizontal row ── */}
          <div className="chips-row flex items-center gap-0 overflow-x-auto w-full justify-center mb-3 flex-nowrap">
            {chips.map((chip, i) => (
              <div key={chip} className="flex items-center flex-nowrap flex-shrink-0">
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: '#7A6A58',
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap',
                  padding: '0 6px',
                }}>
                  {chip}
                </span>
                {i < chips.length - 1 && (
                  <span style={{ color: '#C8BAA8', fontSize: 11, flexShrink: 0 }}>·</span>
                )}
              </div>
            ))}
          </div>

          {/* Tagline */}
          <motion.p
            key={`tag-${lang}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.20 }}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10.5, fontWeight: 500,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: '#A08060',
              marginBottom: '1.2dvh',
            }}
          >
            {TAGLINE[lang]}
          </motion.p>

          {/* Greeting — bold, compact */}
          <motion.h1
            key={`h-${lang}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: isRTL ? 'var(--font-noto-arabic),serif' : "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: isRTL ? 'clamp(28px, 8vw, 38px)' : 'clamp(30px, 8.5vw, 40px)',
              color: '#1C1917',
              letterSpacing: isRTL ? '0.01em' : '-0.025em',
              lineHeight: 1.05,
              marginBottom: '1dvh',
            }}
          >
            {GREETING[lang]}
          </motion.h1>

          {/* Table + location — compact */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
            style={{
              fontSize: 12.5, fontWeight: 400,
              color: '#B0A090',
              letterSpacing: '0.02em',
            }}
          >
            {isRTL ? `طاولة #${table}` : `Table #${table}`}
            <span style={{ margin: '0 6px', opacity: 0.5 }}>·</span>
            Mekkah, KSA
          </motion.p>
        </div>

        {/* Bottom group: CTA + language switcher */}
        <div className="flex flex-col items-center gap-2.5">

          {/* ── CTA button — compact, dominant ── */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            whileTap={{ scale: 0.97 }}
            onClick={start}
            disabled={going}
            className="cta-breathe w-full relative overflow-hidden rounded-[16px] flex items-center justify-between disabled:opacity-60"
            style={{
              paddingTop: 17, paddingBottom: 17,
              paddingLeft: 24, paddingRight: 20,
              background: `linear-gradient(135deg, #FF8147 0%, ${P} 50%, #E85920 100%)`,
            }}
          >
            {/* Shimmer */}
            <div
              className="shimmer-cta absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.16) 50%, transparent 70%)' }}
            />
            <span
              className="relative z-10 text-white"
              style={{
                fontFamily: isRTL ? 'var(--font-noto-arabic),serif' : "'Bricolage Grotesque', sans-serif",
                fontWeight: 700, fontSize: 16,
                letterSpacing: '0.01em',
              }}
            >
              {going ? '...' : CTA[lang]}
            </span>
            <div
              className="relative z-10 flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.18)' }}
            >
              <ChevronRight size={17} strokeWidth={2.5} className="text-white" />
            </div>
          </motion.button>

          {/* ── Language switcher — compact inline pill row ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.44 }}
            className="flex items-center gap-1"
            style={{
              padding: '6px 14px',
              borderRadius: 100,
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <Globe size={11} style={{ color: '#A09080', flexShrink: 0 }} />
            {LANGUAGES.map((l, i) => (
              <div key={l.code} className="flex items-center gap-1">
                {i > 0 && <span style={{ color: '#D0C8C0', fontSize: 11, lineHeight: 1 }}>|</span>}
                <button
                  onClick={() => l.code === lang ? setSheet(true) : selectLang(l.code)}
                  style={{
                    fontFamily: l.code === 'ar' ? 'var(--font-noto-arabic),serif' : "'DM Sans', sans-serif",
                    fontSize: l.code === 'ar' ? 12 : 11,
                    fontWeight: lang === l.code ? 700 : 500,
                    color: lang === l.code ? '#1C1917' : '#A09080',
                    letterSpacing: '0.04em',
                    padding: '2px 5px',
                    borderRadius: 4,
                    background: lang === l.code ? 'rgba(0,0,0,0.05)' : 'transparent',
                    minWidth: 28, textAlign: 'center',
                  }}
                >
                  {l.label}
                </button>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <LangSheet open={sheet} onClose={() => setSheet(false)} onSelect={selectLang} current={lang} />
    </div>
  )
}
