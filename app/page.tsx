'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronRight, Globe, X } from 'lucide-react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { Language } from '@/types'

const STORAGE_KEY = 'serasa_lang'
const P  = '#FF6B35'
const BG = '#F5F2EE'

type LangCfg = { code: Language; flag: string; native: string; greeting: string; dir: 'ltr' | 'rtl' }

const LANGUAGES: LangCfg[] = [
  { code: 'en', flag: '🇬🇧', native: 'English',          greeting: 'Welcome',        dir: 'ltr' },
  { code: 'id', flag: '🇮🇩', native: 'Bahasa Indonesia', greeting: 'Selamat Datang', dir: 'ltr' },
  { code: 'ar', flag: '🇸🇦', native: 'العربية',           greeting: 'أهلاً وسهلاً',   dir: 'rtl' },
]

const GREETING:    Record<Language, string> = { id: 'Selamat Datang',           en: 'Welcome',                      ar: 'أهلاً وسهلاً'          }
const TAGLINE:     Record<Language, string> = { id: 'Masakan Indonesia Autentik',en: 'Authentic Indonesian Cuisine', ar: 'مطبخ إندونيسي أصيل'   }
const CTA:         Record<Language, string> = { id: 'Mulai Memesan',            en: 'Start Ordering',               ar: 'ابدأ الطلب'            }
const CHANGE_LANG: Record<Language, string> = { id: 'Bahasa',                   en: 'Language',                     ar: 'اللغة'                  }
const SELECT_LANG: Record<Language, string> = { id: 'Pilih Bahasa',             en: 'Select Language',              ar: 'اختر اللغة'            }

const CHIPS: Record<Language, { icon: string; label: string }[]> = {
  en: [{ icon: '★', label: '4.9 Rating' }, { icon: '✓', label: 'Halal Cert.' }, { icon: '⚡', label: 'Quick Order' }],
  id: [{ icon: '★', label: '4.9 Ulasan' }, { icon: '✓', label: 'Halal' },       { icon: '⚡', label: 'Pesan Cepat' }],
  ar: [{ icon: '★', label: '٤.٩ تقييم' }, { icon: '✓', label: 'حلال' },         { icon: '⚡', label: 'طلب سريع'   }],
}

function detectLang(): Language {
  if (typeof window === 'undefined') return 'en'
  const n = navigator.language.toLowerCase()
  if (n.startsWith('ar')) return 'ar'
  if (n.startsWith('id') || n.startsWith('ms')) return 'id'
  return 'en'
}

// ── Bottom sheet ─────────────────────────────────────────────────────────
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
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            drag="y" dragConstraints={{ top: 0 }} dragElastic={0.08}
            onDragEnd={(_, i) => { if (i.offset.y > 80) onClose() }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px]"
            style={{ background: '#FFFFFF', boxShadow: '0 -4px 60px rgba(0,0,0,0.12)', y }}
          >
            <div className="flex justify-center pt-3.5 pb-2">
              <div className="w-9 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center justify-between px-6 pt-2 pb-5">
              <h2 className="font-bold text-[19px] text-gray-900"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {SELECT_LANG[current]}
              </h2>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={14} className="text-gray-500" />
              </button>
            </div>
            <div className="px-5 pb-10 space-y-3">
              {LANGUAGES.map(l => {
                const active = l.code === current
                return (
                  <motion.button key={l.code} whileTap={{ scale: 0.975 }}
                    onClick={() => onSelect(l.code)} dir={l.dir}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-colors"
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
    setTimeout(() => router.push(`/menu?table=${table}`), 220)
  }

  if (!mounted) return null
  const isRTL = lang === 'ar'
  const chips = CHIPS[lang]

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: '100dvh', background: BG, fontFamily: "'DM Sans', sans-serif" }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        @keyframes float-food {
          0%,100% { transform: scale(0.94) translateY(0) }
          50%      { transform: scale(0.94) translateY(-7px) }
        }
        @keyframes cta-glow {
          0%,100% { box-shadow: 0 7px 24px rgba(255,107,53,0.36), 0 2px 7px rgba(255,107,53,0.18), inset 0 1px 0 rgba(255,255,255,0.22) }
          50%      { box-shadow: 0 11px 32px rgba(255,107,53,0.46), 0 3px 11px rgba(255,107,53,0.26), inset 0 1px 0 rgba(255,255,255,0.22) }
        }
        @keyframes cta-shimmer {
          0%   { transform: translateX(-120%) }
          100% { transform: translateX(220%) }
        }
        .food-float { animation: float-food 10s ease-in-out infinite; }
        .cta-glow   { animation: cta-glow 3s ease-in-out infinite; }
        .cta-shine  { animation: cta-shimmer 3.5s ease-in-out infinite; animation-delay: 1.2s; }
      `}</style>

      {/* ── HERO — compact ──────────────────────────────────────────────── */}
      <div className="relative flex-shrink-0 overflow-hidden" style={{ height: '42dvh', background: '#1A1410' }}>

        {/* Food image — editorial scale, slow float */}
        <div className="absolute inset-0 food-float">
          <Image
            src={heroImg || '/hero-food.png'}
            alt="Indonesian cuisine" fill priority
            className="object-cover object-center"
            style={{ filter: 'brightness(0.88) saturate(1.14) contrast(1.04)' }}
            sizes="100vw"
          />
        </div>

        {/* Cinematic gradient — dark top, fades to cream */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(180deg,
            rgba(20,16,12,0.55) 0%,
            rgba(20,16,12,0.14) 28%,
            rgba(20,16,12,0.04) 50%,
            rgba(20,16,12,0.22) 68%,
            rgba(245,242,238,0.70) 86%,
            ${BG} 100%)`,
        }} />

        {/* ── LOGO — prominent white pill, always visible ── */}
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-0 right-0 flex justify-center z-10"
          style={{ top: 'clamp(18px, 3.5dvh, 28px)' }}
        >
          {/* Solid white pill — maksimal keterbacaan logo */}
          <div style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 100,
            padding: '8px 24px',
            border: '1px solid rgba(255,255,255,0.98)',
            boxShadow: '0 4px 28px rgba(0,0,0,0.22), 0 1px 0 rgba(255,255,255,1) inset',
          }}>
            <div style={{ position: 'relative', width: 140, height: 50 }}>
              <Image src="/logof22.png" alt="Serasa" fill className="object-contain" priority sizes="140px" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── CONTENT — flex-1, justify-between ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 flex flex-col justify-between overflow-hidden"
        style={{ padding: '3dvh 20px clamp(14px, 2.5dvh, 22px)' }}
      >
        {/* ── TOP: chips + text ── */}
        <div className="flex flex-col items-center text-center gap-0">

          {/* Trust chips — single row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
            {chips.map((chip, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: '#EDEAE5', border: '1px solid rgba(180,160,135,0.22)' }}>
                <span style={{ fontSize: 11, color: '#8A7A65' }}>{chip.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#6B5A47', letterSpacing: '0.01em' }}>
                  {chip.label}
                </span>
              </div>
            ))}
          </div>

          {/* Tagline */}
          <motion.p key={`tag-${lang}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.20 }}
            style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#A08060', marginBottom: 6 }}>
            {TAGLINE[lang]}
          </motion.p>

          {/* Greeting */}
          <motion.h1 key={`h-${lang}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: isRTL ? 'var(--font-noto-arabic),serif' : "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: isRTL ? 'clamp(28px, 8vw, 36px)' : 'clamp(30px, 8.5vw, 40px)',
              color: '#1C1917',
              letterSpacing: isRTL ? '0.01em' : '-0.025em',
              lineHeight: 1.05,
              marginBottom: 6,
            }}>
            {GREETING[lang]}
          </motion.h1>

          {/* Table */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
            style={{ fontSize: 12.5, color: '#A09080', letterSpacing: '0.02em' }}>
            {isRTL ? `طاولة #${table}` : `Table #${table}`}
            <span style={{ margin: '0 7px', opacity: 0.4 }}>·</span>
            Mekkah, KSA
          </motion.p>
        </div>

        {/* ── BOTTOM: CTA + language ── */}
        <div className="flex flex-col items-center gap-3">

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            whileTap={{ scale: 0.97 }}
            onClick={start}
            disabled={going}
            className="cta-glow w-full relative overflow-hidden rounded-[16px] flex items-center justify-between disabled:opacity-60"
            style={{
              paddingTop: 17, paddingBottom: 17,
              paddingLeft: 22, paddingRight: 18,
              background: `linear-gradient(135deg, #FF8147 0%, ${P} 50%, #E85920 100%)`,
            }}
          >
            <div className="cta-shine absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.16) 50%, transparent 70%)' }} />
            <span className="relative z-10 text-white"
              style={{
                fontFamily: isRTL ? 'var(--font-noto-arabic),serif' : "'Bricolage Grotesque', sans-serif",
                fontWeight: 700, fontSize: 16, letterSpacing: '0.01em',
              }}>
              {going ? '...' : CTA[lang]}
            </span>
            <div className="relative z-10 flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.18)' }}>
              <ChevronRight size={17} strokeWidth={2.5} className="text-white" />
            </div>
          </motion.button>

          {/* Language switcher */}
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSheet(true)}
            className="flex items-center justify-center gap-2 px-5 py-2"
            style={{
              borderRadius: 100,
              background: 'rgba(0,0,0,0.045)',
              border: '1px solid rgba(0,0,0,0.07)',
            }}
          >
            <Globe size={12} style={{ color: '#8A7A6A' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
              letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A7A6A' }}>
              {CHANGE_LANG[lang]}
            </span>
          </motion.button>
        </div>
      </motion.div>

      <LangSheet open={sheet} onClose={() => setSheet(false)} onSelect={selectLang} current={lang} />
    </div>
  )
}
