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

type LangCfg = { code: Language; flag: string; native: string; greeting: string; dir: 'ltr' | 'rtl' }

const LANGUAGES: LangCfg[] = [
  { code: 'en', flag: '🇬🇧', native: 'English',          greeting: 'Welcome',        dir: 'ltr' },
  { code: 'id', flag: '🇮🇩', native: 'Bahasa Indonesia', greeting: 'Selamat Datang', dir: 'ltr' },
  { code: 'ar', flag: '🇸🇦', native: 'العربية',           greeting: 'أهلاً وسهلاً',   dir: 'rtl' },
]

const GREETING:    Record<Language, string> = { id: 'Selamat Datang',            en: 'Welcome',                   ar: 'أهلاً وسهلاً'          }
const TAGLINE:     Record<Language, string> = { id: 'Masakan Indonesia Autentik', en: 'Authentic Indonesian Cuisine', ar: 'مطبخ إندونيسي أصيل' }
const CTA:         Record<Language, string> = { id: 'Mulai Memesan',             en: 'Start Ordering',            ar: 'ابدأ الطلب'            }
const CHANGE_LANG: Record<Language, string> = { id: 'Bahasa',                    en: 'Language',                  ar: 'اللغة'                  }
const SELECT_LANG: Record<Language, string> = { id: 'Pilih Bahasa',              en: 'Select Language',           ar: 'اختر اللغة'            }

const TRUST_EN = [
  { icon: <Leaf size={12} strokeWidth={2} />,  label: 'Halal Certified' },
  { icon: <Star size={12} strokeWidth={2} />,  label: '4.9 · 500+ Reviews' },
  { icon: <Zap  size={12} strokeWidth={2} />,  label: 'Quick Table Ordering' },
]
const TRUST_ID = [
  { icon: <Leaf size={12} strokeWidth={2} />,  label: 'Bersertifikat Halal' },
  { icon: <Star size={12} strokeWidth={2} />,  label: '4.9 · 500+ Ulasan' },
  { icon: <Zap  size={12} strokeWidth={2} />,  label: 'Pesan di Meja Cepat' },
]
const TRUST_AR = [
  { icon: <Leaf size={12} strokeWidth={2} />,  label: 'حلال معتمد' },
  { icon: <Star size={12} strokeWidth={2} />,  label: '٤.٩ · ٥٠٠+ تقييم' },
  { icon: <Zap  size={12} strokeWidth={2} />,  label: 'طلب سريع على الطاولة' },
]
const TRUST_MAP: Record<Language, typeof TRUST_EN> = { en: TRUST_EN, id: TRUST_ID, ar: TRUST_AR }

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
  const trust = TRUST_MAP[lang]

  return (
    <div className="min-h-dvh overflow-hidden"
      style={{ background: BG, fontFamily: "'DM Sans', sans-serif" }}
      dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) }
          50%       { transform: translateY(-8px) }
        }
        @keyframes cta-pulse {
          0%, 100% { box-shadow: 0 8px 28px rgba(255,107,53,0.36), 0 2px 8px rgba(255,107,53,0.20) }
          50%       { box-shadow: 0 12px 36px rgba(255,107,53,0.45), 0 4px 12px rgba(255,107,53,0.28) }
        }
        @keyframes badge-shimmer {
          0%   { transform: translateX(-100%) }
          100% { transform: translateX(400%) }
        }
        .hero-float { animation: float-slow 9s ease-in-out infinite; }
        .cta-pulse  { animation: cta-pulse 3.2s ease-in-out infinite; }
      `}</style>

      {/* ── HERO — editorial food stage ────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: '58dvh', background: '#1A1410' }}>

        {/* Food image — editorial framing, slight pull-back */}
        <motion.div
          className="absolute inset-0 hero-float"
          style={{ scale: 0.94 }}
        >
          <Image
            src={heroImg || '/hero-food.png'}
            alt="Indonesian Cuisine" fill priority
            className="object-cover object-center"
            style={{ filter: 'brightness(0.90) saturate(1.12) contrast(1.05)' }}
            sizes="100vw"
          />
        </motion.div>

        {/* Cinematic dark gradient — NOT white fade, preserves food */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `
            linear-gradient(
              180deg,
              rgba(20,16,12,0.55) 0%,
              rgba(20,16,12,0.15) 30%,
              rgba(20,16,12,0.05) 52%,
              rgba(20,16,12,0.28) 72%,
              rgba(245,242,238,0.72) 88%,
              ${BG} 100%
            )
          `,
        }} />

        {/* Soft vignette edges */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 110% 100% at 50% 50%, transparent 55%, rgba(20,16,12,0.22) 100%)',
        }} />

        {/* ── LOGO — glassmorphism pill ── */}
        <motion.div
          initial={{ opacity: 0, y: -18, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-10 left-0 right-0 flex justify-center z-10"
        >
          <div style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            borderRadius: 100,
            padding: '9px 26px 9px',
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}>
            <div style={{ position: 'relative', width: 150, height: 54 }}>
              <Image src="/logof22.png" alt="Serasa" fill className="object-contain" priority sizes="150px"
                style={{ filter: 'brightness(1.08) drop-shadow(0 2px 10px rgba(0,0,0,0.35))' }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── CONTENT — warm luxury cream ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="px-6 pt-5 pb-14 flex flex-col items-center text-center relative"
        style={{ background: BG }}
      >
        {/* ── TRUST BADGES ── */}
        <div className="flex items-center gap-2.5 mb-5 flex-wrap justify-center">
          {trust.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.28 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: '#EFEBE6',
                border: '1px solid rgba(180,160,135,0.30)',
              }}
            >
              {/* Subtle shimmer on badge */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.5) 50%, transparent 65%)',
                  animation: `badge-shimmer ${6 + i * 1.2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.8}s`,
                }}
              />
              <span style={{ color: '#8A7A65' }}>{t.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#6B5A47', letterSpacing: '0.02em' }}>
                {t.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* TAGLINE */}
        <motion.p
          key={`tag-${lang}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12, fontWeight: 500,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#A08060',
            marginBottom: 8,
          }}
        >
          {TAGLINE[lang]}
        </motion.p>

        {/* GREETING — bold modern display */}
        <motion.h1
          key={`h-${lang}`}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: isRTL ? 'var(--font-noto-arabic),serif' : "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            fontSize: isRTL ? 'clamp(34px, 9.5vw, 46px)' : 'clamp(36px, 10vw, 50px)',
            color: '#1C1917',
            letterSpacing: isRTL ? '0.01em' : '-0.025em',
            lineHeight: 1.05,
            marginBottom: 10,
          }}
        >
          {GREETING[lang]}
        </motion.h1>

        {/* Table + location */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}
          style={{
            fontSize: 13.5, fontWeight: 400,
            color: '#A09080',
            letterSpacing: '0.02em',
            marginBottom: 28,
          }}
        >
          {isRTL ? `طاولة #${table}` : `Table #${table}`}
          <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
          Mekkah, KSA
        </motion.p>

        {/* ── CTA button ── */}
        <motion.button
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          whileTap={{ scale: 0.97 }}
          onClick={start}
          disabled={going}
          className="cta-pulse w-full relative overflow-hidden rounded-[18px] flex items-center justify-between px-7 disabled:opacity-60"
          style={{
            paddingTop: 20, paddingBottom: 20,
            background: `linear-gradient(135deg, #FF8147 0%, ${P} 50%, #E85920 100%)`,
            boxShadow: `
              0 8px 28px rgba(255,107,53,0.36),
              0 2px 8px rgba(255,107,53,0.20),
              inset 0 1px 0 rgba(255,255,255,0.22)
            `,
          }}
        >
          {/* CTA shimmer */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)' }}
            animate={{ x: ['-120%', '220%'] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'linear', repeatDelay: 0.5 }}
          />

          <span
            className="relative z-10 text-white"
            style={{
              fontFamily: isRTL ? 'var(--font-noto-arabic),serif' : "'Bricolage Grotesque', sans-serif",
              fontWeight: 700, fontSize: 17,
              letterSpacing: isRTL ? '0.02em' : '0.01em',
            }}
          >
            {going ? '...' : CTA[lang]}
          </span>

          <motion.div
            className="relative z-10 flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.20)' }}
            animate={{ x: going ? 4 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <ChevronRight size={18} strokeWidth={2.5} className="text-white" />
          </motion.div>
        </motion.button>

        {/* ── Language switcher — clean pill ── */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.50 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setSheet(true)}
          className="flex items-center justify-center gap-2 mt-5 px-5 py-2.5 rounded-full transition-colors"
          style={{
            background: 'rgba(0,0,0,0.045)',
            border: '1px solid rgba(0,0,0,0.07)',
          }}
        >
          <Globe size={13} style={{ color: '#8A7A6A' }} />
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#8A7A6A',
          }}>
            {CHANGE_LANG[lang]}
          </span>
        </motion.button>

        {/* ── Decorative bottom section ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="flex items-center gap-3 mt-8"
        >
          {/* Elegant horizontal rule with text */}
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, rgba(160,128,96,0.18))' }} />
          <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.20em', color: '#BEB0A0', textTransform: 'uppercase' }}>
            Serasa Restaurant
          </span>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(160,128,96,0.18), transparent)' }} />
        </motion.div>

        {/* Certified/branding micro line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.72 }}
          style={{ fontSize: 11, color: '#C8BAA8', marginTop: 6, letterSpacing: '0.05em' }}
        >
          Kuday, Mekkah · KSA
        </motion.p>
      </motion.div>

      <LangSheet open={sheet} onClose={() => setSheet(false)} onSelect={selectLang} current={lang} />
    </div>
  )
}
