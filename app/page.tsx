'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronRight, Globe, X, Star, Zap, Check } from 'lucide-react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { Language } from '@/types'

const STORAGE_KEY = 'serasa_lang'
const P  = '#FF6B35'
const BG = '#F3E4BE'

type LangCfg = { code: Language; flag: string; native: string; greeting: string; dir: 'ltr' | 'rtl' }

const LANGUAGES: LangCfg[] = [
  { code: 'en', flag: '🇬🇧', native: 'English',          greeting: 'Welcome',        dir: 'ltr' },
  { code: 'id', flag: '🇮🇩', native: 'Bahasa Indonesia', greeting: 'Selamat Datang', dir: 'ltr' },
  { code: 'ar', flag: '🇸🇦', native: 'العربية',           greeting: 'أهلاً وسهلاً',   dir: 'rtl' },
]

const GREETING:    Record<Language, string> = { id: 'Selamat Datang',              en: 'Welcome',                      ar: 'أهلاً وسهلاً'        }
const TAGLINE:     Record<Language, string> = { id: 'MASAKAN INDONESIA ASLI',       en: 'AUTHENTIC INDONESIAN CUISINE', ar: 'مطبخ إندونيسي أصيل' }
const CTA:         Record<Language, string> = { id: 'Mulai Memesan',               en: 'Start Ordering',               ar: 'ابدأ الطلب'          }
const CHANGE_LANG: Record<Language, string> = { id: 'Bahasa',                      en: 'Language',                     ar: 'اللغة'               }
const SELECT_LANG: Record<Language, string> = { id: 'Pilih Bahasa',                en: 'Select Language',              ar: 'اختر اللغة'          }

function detectLang(): Language {
  if (typeof window === 'undefined') return 'en'
  const n = navigator.language.toLowerCase()
  if (n.startsWith('ar')) return 'ar'
  if (n.startsWith('id') || n.startsWith('ms')) return 'id'
  return 'en'
}

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
      style={{ height: '100dvh', background: BG, position: 'relative' }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ── CSS animations ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap');

        /* ── Bokeh orb pulses ── */
        @keyframes bokeh-a {
          0%,100% { transform: scale(1)    translateY(0px);   opacity: 0.60; }
          50%     { transform: scale(1.18) translateY(-12px); opacity: 0.80; }
        }
        @keyframes bokeh-b {
          0%,100% { transform: scale(1.08) translateX(0px);   opacity: 0.45; }
          40%     { transform: scale(0.88) translateX(10px);  opacity: 0.65; }
          80%     { transform: scale(1.12) translateX(-6px);  opacity: 0.50; }
        }
        @keyframes bokeh-c {
          0%,100% { transform: scale(0.9);  opacity: 0.35; }
          60%     { transform: scale(1.25); opacity: 0.58; }
        }
        @keyframes bokeh-d {
          0%,100% { transform: scale(1) rotate(0deg);   opacity: 0.70; }
          50%     { transform: scale(1.1) rotate(20deg); opacity: 0.90; }
        }

        /* ── Plate animations ── */
        @keyframes plate-enter {
          0%   { opacity: 0; transform: scale(0.78) translateY(28px); }
          65%  { opacity: 1; transform: scale(1.04) translateY(-6px); }
          82%  { transform: scale(0.98) translateY(2px); }
          100% { opacity: 1; transform: scale(1)    translateY(0px); }
        }
        @keyframes plate-float {
          0%,100% { transform: translateY(0px)   rotate(0deg); }
          30%     { transform: translateY(-9px)  rotate(0.4deg); }
          70%     { transform: translateY(-5px)  rotate(-0.3deg); }
        }

        /* ── Plate glow ring ── */
        @keyframes glow-ring {
          0%,100% { opacity: 0.55; transform: scale(1); }
          50%     { opacity: 0.80; transform: scale(1.08); }
        }

        /* ── Logo entrance ── */
        @keyframes drop-in {
          0%   { opacity: 0; transform: translateY(-32px) scale(0.86); }
          60%  { opacity: 1; transform: translateY(5px)   scale(1.03); }
          80%  { transform: translateY(-2px) scale(0.99); }
          100% { opacity: 1; transform: translateY(0)     scale(1);    }
        }

        /* ── Badge spring pop ── */
        @keyframes badge-pop {
          0%   { opacity: 0; transform: translateY(14px) scale(0.82); }
          65%  { opacity: 1; transform: translateY(-4px) scale(1.06); }
          82%  { transform: translateY(1px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0)    scale(1);    }
        }

        /* ── Text fade-up ── */
        @keyframes fade-up {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0);    }
        }

        /* ── CTA breathe glow ── */
        @keyframes cta-glow {
          0%,100% { box-shadow: 0 6px 22px rgba(255,107,53,0.38), 0 2px 8px rgba(255,107,53,0.22); }
          50%     { box-shadow: 0 12px 40px rgba(255,107,53,0.62), 0 5px 14px rgba(255,107,53,0.36); }
        }

        /* ── CTA shimmer sweep ── */
        @keyframes shimmer {
          0%   { transform: translateX(-160%) skewX(-18deg); }
          100% { transform: translateX(340%)  skewX(-18deg); }
        }

        /* ── Assign animations ── */
        .bokeh-1 { animation: bokeh-a 4.8s ease-in-out infinite; }
        .bokeh-2 { animation: bokeh-b 6.2s ease-in-out 0.8s infinite; }
        .bokeh-3 { animation: bokeh-c 4.0s ease-in-out 1.4s infinite; }
        .bokeh-4 { animation: bokeh-d 5.5s ease-in-out 0.4s infinite; }

        .glow-ring  { animation: glow-ring  3.6s ease-in-out 1s infinite; }
        .plate-in   { animation: plate-enter 1.0s cubic-bezier(0.34,1.56,0.64,1) 0.12s both; }
        .plate-fly  { animation: plate-float 4.2s ease-in-out 1.3s infinite; }

        .logo-anim  { animation: drop-in  0.82s cubic-bezier(0.34,1.56,0.64,1) 0.06s both; }

        .badge-1    { animation: badge-pop 0.58s cubic-bezier(0.34,1.56,0.64,1) 0.52s both; }
        .badge-2    { animation: badge-pop 0.58s cubic-bezier(0.34,1.56,0.64,1) 0.66s both; }
        .badge-3    { animation: badge-pop 0.58s cubic-bezier(0.34,1.56,0.64,1) 0.80s both; }

        .text-1     { animation: fade-up 0.60s ease-out 0.92s both; }
        .text-2     { animation: fade-up 0.72s cubic-bezier(0.16,1,0.3,1) 1.04s both; }
        .text-3     { animation: fade-up 0.52s ease-out 1.14s both; }

        .cta-wrap   { animation: fade-up 0.65s ease-out 1.24s both,
                                 cta-glow 3.2s ease-in-out 2.4s infinite; }
        .cta-shine  { animation: shimmer 3.0s ease-in-out 2.8s infinite; }

        .lang-btn   { animation: fade-up 0.50s ease-out 1.38s both; }
      `}</style>

      {/* ── BOKEH ORBS ──────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Large warm amber — top-left */}
        <div className="bokeh-1 absolute rounded-full" style={{
          width: 260, height: 260,
          background: 'radial-gradient(circle, rgba(255,185,55,0.68) 0%, rgba(255,145,30,0.30) 45%, transparent 68%)',
          top: '-8%', left: '-12%',
          filter: 'blur(3px)',
        }} />
        {/* Medium gold — top-right */}
        <div className="bokeh-2 absolute rounded-full" style={{
          width: 190, height: 190,
          background: 'radial-gradient(circle, rgba(255,205,80,0.60) 0%, rgba(255,170,40,0.25) 50%, transparent 70%)',
          top: '5%', right: '-6%',
          filter: 'blur(2px)',
        }} />
        {/* Small bright — right-middle */}
        <div className="bokeh-3 absolute rounded-full" style={{
          width: 90, height: 90,
          background: 'radial-gradient(circle, rgba(255,220,100,0.80) 0%, rgba(255,190,60,0.35) 55%, transparent 75%)',
          top: '28%', right: '8%',
          filter: 'blur(0.5px)',
        }} />
        {/* Tiny bright accent — left-middle */}
        <div className="bokeh-4 absolute rounded-full" style={{
          width: 60, height: 60,
          background: 'radial-gradient(circle, rgba(255,230,130,0.90) 0%, transparent 65%)',
          top: '22%', left: '12%',
          filter: 'blur(0px)',
        }} />
      </div>

      {/* ── BATIK TEXTURE ────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0, opacity: 0.055 }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="batik" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
              <circle cx="16" cy="16" r="9"   fill="none" stroke="#7B4A1A" strokeWidth="1.3"/>
              <circle cx="16" cy="16" r="3.8" fill="#7B4A1A"/>
              <circle cx="48" cy="48" r="9"   fill="none" stroke="#7B4A1A" strokeWidth="1.3"/>
              <circle cx="48" cy="48" r="3.8" fill="#7B4A1A"/>
              <path d="M48,16 C48,8 40,2 32,6 C24,10 24,22 32,26 C40,30 48,24 48,16Z"
                fill="none" stroke="#7B4A1A" strokeWidth="1.1"/>
              <path d="M16,48 C16,40 8,34 0,38 C-8,42 -8,54 0,58 C8,62 16,56 16,48Z"
                fill="none" stroke="#7B4A1A" strokeWidth="1.1"/>
              <path d="M32,0 Q38,8 32,16 Q26,8 32,0Z" fill="none" stroke="#7B4A1A" strokeWidth="0.9"/>
              <path d="M0,32 Q8,38 16,32 Q8,26 0,32Z"  fill="none" stroke="#7B4A1A" strokeWidth="0.9"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#batik)"/>
        </svg>
      </div>

      {/* ── PLATE AREA ──────────────────────────────────────────────────── */}
      <div
        className="relative flex-shrink-0 flex items-center justify-center"
        style={{ height: '50dvh', zIndex: 1 }}
      >
        {/* Logo pill — top center */}
        <div className="logo-anim absolute left-0 right-0 flex justify-center"
          style={{ top: 'clamp(14px, 3.5dvh, 26px)', zIndex: 10 }}>
          <div style={{
            background: 'rgba(255,255,255,0.96)',
            borderRadius: 100,
            padding: '8px 24px',
            boxShadow: '0 5px 28px rgba(0,0,0,0.16), 0 1px 0 rgba(255,255,255,1) inset',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logof22.png" alt="Serasa" style={{ width: 142, height: 50, objectFit: 'contain', display: 'block' }} />
          </div>
        </div>

        {/* Warm glow ring behind plate */}
        <div className="glow-ring absolute rounded-full pointer-events-none" style={{
          width: 'min(78vw, 320px)', height: 'min(78vw, 320px)',
          background: 'radial-gradient(circle, rgba(255,175,50,0.38) 0%, rgba(255,140,30,0.18) 45%, transparent 68%)',
          filter: 'blur(14px)',
          zIndex: 1,
        }} />

        {/* Plate image — bouncy enter + float */}
        <div className="plate-in" style={{ position: 'relative', zIndex: 2 }}>
          <div className="plate-fly" style={{
            width: 'min(72vw, 288px)', height: 'min(72vw, 288px)',
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 22px 64px rgba(0,0,0,0.26), 0 8px 22px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.10)',
            position: 'relative', flexShrink: 0,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImg || '/hero-food.png'}
              alt="Indonesian cuisine"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center',
                filter: 'brightness(1.05) saturate(1.12)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── BADGE PILLS ─────────────────────────────────────────────────── */}
      <div className="relative flex-shrink-0 flex items-center justify-center gap-2 px-5"
        style={{ zIndex: 1, marginTop: 10, marginBottom: 2 }}>
        {/* Rating */}
        <div className="badge-1 flex items-center gap-1.5 px-3.5 py-[7px] rounded-full"
          style={{
            background: 'rgba(255,255,255,0.90)',
            boxShadow: '0 2px 14px rgba(0,0,0,0.10)',
            backdropFilter: 'blur(10px)',
          }}>
          <Star size={12} fill="#FFB020" color="transparent" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1208', fontFamily: "'Figtree', sans-serif", letterSpacing: '0.01em' }}>
            4.9 Rating
          </span>
        </div>
        {/* Halal */}
        <div className="badge-2 flex items-center gap-1.5 px-3.5 py-[7px] rounded-full"
          style={{
            background: 'rgba(255,255,255,0.90)',
            boxShadow: '0 2px 14px rgba(0,0,0,0.10)',
            backdropFilter: 'blur(10px)',
          }}>
          <Check size={12} strokeWidth={3} color="#22C55E" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1208', fontFamily: "'Figtree', sans-serif", letterSpacing: '0.01em' }}>
            Halal Cert.
          </span>
        </div>
        {/* Quick Order */}
        <div className="badge-3 flex items-center gap-1.5 px-3.5 py-[7px] rounded-full"
          style={{
            background: 'rgba(255,255,255,0.90)',
            boxShadow: '0 2px 14px rgba(0,0,0,0.10)',
            backdropFilter: 'blur(10px)',
          }}>
          <Zap size={12} fill={P} color="transparent" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1208', fontFamily: "'Figtree', sans-serif", letterSpacing: '0.01em' }}>
            Quick Order
          </span>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center text-center overflow-hidden"
        style={{ padding: '10px 24px 18px', fontFamily: "'Figtree', sans-serif", zIndex: 1, position: 'relative' }}
      >
        {/* Text group */}
        <div className="flex flex-col items-center">
          {/* Tagline — small caps */}
          <p className="text-1" style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: '#9A7A55',
            marginBottom: 5,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
            {TAGLINE[lang]}
          </p>

          {/* Greeting — big bold */}
          <h1 className="text-2" style={{
            fontSize: isRTL ? 'clamp(28px, 8.5vw, 40px)' : 'clamp(32px, 9.5vw, 46px)',
            fontWeight: 900,
            color: '#1A0E04',
            letterSpacing: isRTL ? '0.01em' : '-0.025em',
            lineHeight: 1.05,
            marginBottom: 7,
            fontFamily: isRTL ? 'var(--font-noto-arabic), serif' : undefined,
          }}>
            {GREETING[lang]}
          </h1>

          {/* Table + location */}
          <p className="text-3" style={{ fontSize: 13.5, fontWeight: 500, color: '#9A7A55', letterSpacing: '0.02em' }}>
            {isRTL ? `طاولة #${table}` : `Table #${table}`}
            <span style={{ margin: '0 8px', opacity: 0.40 }}>·</span>
            Mekkah, KSA
          </p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── CTA button ── */}
        <div className="cta-wrap w-full" style={{ marginBottom: 12, borderRadius: 16 }}>
          <button
            onClick={start}
            disabled={going}
            className="w-full relative overflow-hidden disabled:opacity-60"
            style={{
              background: `linear-gradient(108deg, #FF8C4A 0%, ${P} 42%, #E85220 100%)`,
              borderRadius: 16,
              paddingTop: 18,
              paddingBottom: 18,
              paddingLeft: 26,
              paddingRight: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            {/* Shimmer layer */}
            <div className="cta-shine absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(108deg, transparent 22%, rgba(255,255,255,0.24) 50%, transparent 78%)' }} />
            <span style={{
              fontFamily: "'Figtree', sans-serif",
              fontWeight: 800,
              fontSize: 17,
              color: 'white',
              letterSpacing: '0.01em',
              position: 'relative',
              zIndex: 1,
            }}>
              {going ? '...' : CTA[lang]}
            </span>
            <div style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              position: 'relative', zIndex: 1,
            }}>
              <ChevronRight size={18} strokeWidth={2.5} color="white" />
            </div>
          </button>
        </div>

        {/* Language switcher */}
        <button
          className="lang-btn flex items-center justify-center gap-1.5"
          onClick={() => setSheet(true)}
          style={{
            background: 'rgba(255,255,255,0.72)',
            border: '1px solid rgba(255,255,255,0.55)',
            borderRadius: 100,
            cursor: 'pointer',
            padding: '7px 20px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Globe size={13} color="#9A7A55" />
          <span style={{
            fontFamily: "'Figtree', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#9A7A55',
          }}>
            {CHANGE_LANG[lang]}
          </span>
        </button>
      </div>

      <LangSheet open={sheet} onClose={() => setSheet(false)} onSelect={selectLang} current={lang} />
    </div>
  )
}
