'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronRight, Globe, X } from 'lucide-react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { Language } from '@/types'

const STORAGE_KEY = 'serasa_lang'
const P  = '#FF6B35'
const BG = '#FAFAF5'

type LangCfg = { code: Language; flag: string; native: string; greeting: string; dir: 'ltr' | 'rtl' }

const LANGUAGES: LangCfg[] = [
  { code: 'en', flag: '🇬🇧', native: 'English',          greeting: 'Welcome',        dir: 'ltr' },
  { code: 'id', flag: '🇮🇩', native: 'Bahasa Indonesia', greeting: 'Selamat Datang', dir: 'ltr' },
  { code: 'ar', flag: '🇸🇦', native: 'العربية',           greeting: 'أهلاً وسهلاً',   dir: 'rtl' },
]

const GREETING:    Record<Language, string> = { id: 'Selamat Datang',            en: 'Welcome',                      ar: 'أهلاً وسهلاً'         }
const TAGLINE:     Record<Language, string> = { id: 'Dari Indonesia untuk dunia', en: 'From Indonesia, for the world', ar: 'من إندونيسيا للعالم'  }
const CTA:         Record<Language, string> = { id: 'Mulai Memesan',             en: 'Start Ordering',               ar: 'ابدأ الطلب'           }
const CHANGE_LANG: Record<Language, string> = { id: 'Ganti Bahasa',              en: 'Change Language',              ar: 'تغيير اللغة'          }
const SELECT_LANG: Record<Language, string> = { id: 'Pilih Bahasa',              en: 'Select Language',              ar: 'اختر اللغة'           }

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
              <h2 className="font-bold text-[19px] text-gray-900">{SELECT_LANG[current]}</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
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
                    style={{ background: active ? `${P}0D` : '#FAFAF8', borderColor: active ? P : '#EDEAE5' }}>
                    <span className="text-3xl leading-none flex-shrink-0">{l.flag}</span>
                    <div className={`flex-1 ${l.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      <p className="font-bold text-[15px]" style={{ color: active ? P : '#1C1917' }}>{l.native}</p>
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

  return (
    <div
      className="overflow-hidden flex flex-col"
      style={{ height: '100dvh', background: BG }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ── CSS animations ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap');

        /* Ken Burns — slow cinematic zoom */
        @keyframes ken-burns {
          0%   { transform: scale(1.10) }
          100% { transform: scale(1.00) }
        }

        /* Logo drops in from top */
        @keyframes drop-in {
          0%   { opacity:0; transform: translateY(-22px) scale(0.92) }
          100% { opacity:1; transform: translateY(0)    scale(1)    }
        }

        /* Content elements fade up */
        @keyframes fade-up {
          0%   { opacity:0; transform: translateY(18px) }
          100% { opacity:1; transform: translateY(0)    }
        }

        /* CTA button breathe */
        @keyframes cta-breathe {
          0%,100% { box-shadow: 0 4px 20px rgba(255,107,53,0.32), 0 2px 6px rgba(255,107,53,0.18) }
          50%     { box-shadow: 0 8px 28px rgba(255,107,53,0.46), 0 3px 9px rgba(255,107,53,0.26) }
        }

        /* CTA shimmer sweep */
        @keyframes cta-shimmer {
          0%   { transform: translateX(-120%) }
          100% { transform: translateX(220%)  }
        }

        /* Fill mode helper */
        .anim-fill { animation-fill-mode: both; }

        .hero-img      { animation: ken-burns 9s cubic-bezier(0.16,1,0.3,1) forwards; }
        .logo-anim     { animation: drop-in  0.75s cubic-bezier(0.16,1,0.3,1) 0.08s both; }
        .text-1        { animation: fade-up  0.65s ease-out 0.30s both; }
        .text-2        { animation: fade-up  0.65s ease-out 0.42s both; }
        .text-3        { animation: fade-up  0.55s ease-out 0.54s both; }
        .cta-anim      { animation: fade-up  0.65s ease-out 0.66s both,
                                    cta-breathe 3s ease-in-out 1.8s infinite; }
        .lang-anim     { animation: fade-up  0.55s ease-out 0.80s both; }
        .cta-shine     { animation: cta-shimmer 3.5s ease-in-out 2s infinite; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <div className="relative flex-shrink-0 overflow-hidden"
        style={{ height: '58dvh', background: '#1A1208' }}>

        {/* Ken Burns food image */}
        <div className="hero-img absolute inset-0" style={{ transformOrigin: 'center 40%' }}>
          <Image
            src={heroImg || '/hero-food.png'}
            alt="Indonesian cuisine" fill priority
            className="object-cover object-center"
            style={{ filter: 'brightness(0.88) saturate(1.08)' }}
            sizes="100vw"
          />
        </div>

        {/* Soft cream gradient at bottom — matches reference */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `linear-gradient(
            to bottom,
            rgba(0,0,0,0.18) 0%,
            transparent 30%,
            transparent 50%,
            rgba(250,250,245,0.55) 80%,
            ${BG} 100%
          )`,
        }} />

        {/* ── LOGO pill — centered, white, prominent ── */}
        <div className="logo-anim absolute left-0 right-0 flex justify-center"
          style={{ top: 'clamp(20px, 5dvh, 36px)' }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 100,
            padding: '9px 26px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,1) inset',
          }}>
            <div style={{ position: 'relative', width: 148, height: 52 }}>
              <Image src="/logof22.png" alt="Serasa" fill className="object-contain" priority sizes="148px" />
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center text-center overflow-hidden"
        style={{ padding: '22px 24px 20px', fontFamily: "'Figtree', sans-serif" }}
      >
        {/* Top text group */}
        <div className="flex flex-col items-center">
          {/* Tagline */}
          <p className="text-1"
            style={{ fontSize: 14, fontWeight: 500, color: '#9A8A7A', marginBottom: 4, letterSpacing: '0.01em' }}>
            {TAGLINE[lang]}
          </p>

          {/* Greeting */}
          <h1 className="text-2"
            style={{
              fontSize: isRTL ? 'clamp(30px, 9vw, 40px)' : 'clamp(32px, 9.5vw, 44px)',
              fontWeight: 900,
              color: '#1E1208',
              letterSpacing: isRTL ? '0.01em' : '-0.02em',
              lineHeight: 1.08,
              marginBottom: 8,
              fontFamily: isRTL ? 'var(--font-noto-arabic), serif' : undefined,
            }}>
            {GREETING[lang]}
          </h1>

          {/* Table + location */}
          <p className="text-3"
            style={{ fontSize: 15, fontWeight: 500, color: '#9A8A7A', letterSpacing: '0.01em' }}>
            {isRTL ? `مeja #${table}` : `Meja #${table}`}
            <span style={{ margin: '0 8px', opacity: 0.45 }}>•</span>
            Mekkah, KSA
          </p>
        </div>

        {/* Push CTA down */}
        <div className="flex-1" />

        {/* ── CTA button ── */}
        <div className="cta-anim w-full" style={{ marginBottom: 14 }}>
          <button
            onClick={start}
            disabled={going}
            className="w-full relative overflow-hidden disabled:opacity-60"
            style={{
              background: P,
              borderRadius: 16,
              paddingTop: 19,
              paddingBottom: 19,
              paddingLeft: 28,
              paddingRight: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            {/* Shimmer */}
            <div className="cta-shine absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)' }} />
            <span style={{
              fontFamily: "'Figtree', sans-serif",
              fontWeight: 800, fontSize: 17, color: 'white',
              letterSpacing: '0.01em', position: 'relative', zIndex: 1,
              fontStyle: 'normal',
            }}>
              {going ? '...' : CTA[lang]}
            </span>
            <ChevronRight size={20} strokeWidth={2.5} style={{ color: 'white', flexShrink: 0, position: 'relative', zIndex: 1 }} />
          </button>
        </div>

        {/* Language switcher */}
        <button
          className="lang-anim flex items-center justify-center gap-2"
          onClick={() => setSheet(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 16px',
          }}
        >
          <Globe size={14} style={{ color: '#9A8A7A' }} />
          <span style={{
            fontFamily: "'Figtree', sans-serif",
            fontSize: 12, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: '#9A8A7A',
          }}>
            {CHANGE_LANG[lang]}
          </span>
        </button>
      </div>

      <LangSheet open={sheet} onClose={() => setSheet(false)} onSelect={selectLang} current={lang} />
    </div>
  )
}
