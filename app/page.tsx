'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronRight, Globe, X } from 'lucide-react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { Language } from '@/types'

const STORAGE_KEY = 'serasa_lang'
const P = '#FF6B35'

type LangCfg = { code: Language; flag: string; native: string; greeting: string; dir: 'ltr' | 'rtl' }

const LANGUAGES: LangCfg[] = [
  { code: 'en', flag: '🇬🇧', native: 'English',          greeting: 'Welcome',        dir: 'ltr' },
  { code: 'id', flag: '🇮🇩', native: 'Bahasa Indonesia', greeting: 'Selamat Datang', dir: 'ltr' },
  { code: 'ar', flag: '🇸🇦', native: 'العربية',           greeting: 'أهلاً وسهلاً',   dir: 'rtl' },
]

const GREETING: Record<Language, string>     = { id: 'Selamat Datang', en: 'Welcome', ar: 'أهلاً وسهلاً' }
const TAGLINE: Record<Language, string>      = { id: 'Dari Indonesia untuk dunia', en: 'From Indonesia to the world', ar: 'من إندونيسيا للعالم' }
const CTA: Record<Language, string>          = { id: 'Mulai Memesan', en: 'Start Ordering', ar: 'ابدأ الطلب' }
const CHANGE_LANG: Record<Language, string>  = { id: 'GANTI BAHASA', en: 'CHANGE LANGUAGE', ar: 'تغيير اللغة' }
const SELECT_LANG: Record<Language, string>  = { id: 'Pilih Bahasa', en: 'Select Language', ar: 'اختر اللغة' }

function detectLang(): Language {
  if (typeof window === 'undefined') return 'en'
  const nav = navigator.language.toLowerCase()
  if (nav.startsWith('ar')) return 'ar'
  if (nav.startsWith('id') || nav.startsWith('ms')) return 'id'
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
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            drag="y" dragConstraints={{ top: 0 }} dragElastic={0.1}
            onDragEnd={(_, i) => { if (i.offset.y > 80) onClose() }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px] bg-white"
            style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.12)', y }}
          >
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="font-black text-gray-900 text-xl">{SELECT_LANG[current]}</h2>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="px-5 pb-10 space-y-3">
              {LANGUAGES.map(l => {
                const active = l.code === current
                return (
                  <motion.button key={l.code} whileTap={{ scale: 0.97 }}
                    onClick={() => onSelect(l.code)} dir={l.dir}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all"
                    style={{ background: active ? `${P}10` : '#FAFAF8', borderColor: active ? P : '#EEEBE6' }}>
                    <span className="text-4xl leading-none flex-shrink-0">{l.flag}</span>
                    <div className={`flex-1 ${l.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      <p className="font-black text-[16px]"
                        style={{ color: active ? P : '#1A1208', fontFamily: l.code === 'ar' ? 'var(--font-noto-arabic),serif' : undefined }}>
                        {l.native}
                      </p>
                      <p className="text-sm mt-0.5 text-gray-400">{l.greeting}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: active ? P : '#D0CAC4', background: active ? P : 'transparent' }}>
                      {active && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
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
    // Fetch menu image for hero
    fetch('/api/menu').then(r => r.json()).then((items: { image?: string; is_best_seller?: boolean }[]) => {
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
  const isRTL = lang === 'ar'

  return (
    <div className="min-h-dvh bg-[#FAFAF8] overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── HERO — food photo from menu ── */}
      <div className="relative h-[58dvh] overflow-hidden">
        <Image
          src={heroImg || '/hero-food.png'}
          alt="Indonesian Food" fill priority
          className="object-cover object-center"
          style={{ filter: 'brightness(0.78) saturate(1.15)' }}
          sizes="100vw"
        />
        {/* Bottom fade */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 45%, #FAFAF8 100%)' }} />

        {/* Logo — large, centered, on hero, no card/box */}
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-10 left-0 right-0 flex justify-center"
        >
          <div className="relative w-[240px] h-[86px]"
            style={{ filter: 'drop-shadow(0 6px 28px rgba(0,0,0,0.55)) brightness(1.08)' }}>
            <Image src="/logo.png" alt="Serasa" fill className="object-contain" priority sizes="240px" />
          </div>
        </motion.div>
      </div>

      {/* ── CONTENT — centered ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="px-6 pt-2 pb-10 flex flex-col items-center text-center"
      >
        <motion.p key={`tag-${lang}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-sm mb-1"
          style={{ color: '#9A8A7A', fontFamily: isRTL ? 'var(--font-noto-arabic),serif' : undefined }}>
          {TAGLINE[lang]}
        </motion.p>

        <motion.h1 key={`h-${lang}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="font-black leading-tight mb-2"
          style={{
            fontSize: 'clamp(32px, 9vw, 44px)', color: '#1A1208',
            letterSpacing: '-0.03em',
            fontFamily: isRTL ? 'var(--font-noto-arabic),serif' : undefined,
          }}>
          {GREETING[lang]}
        </motion.h1>

        <p className="mb-8" style={{ color: '#B0A098', fontSize: 14 }}>
          Meja #{table} · Mekkah, KSA
        </p>

        {/* CTA — #FF6B35 capsule */}
        <motion.button
          whileTap={{ scale: 0.96 }} onClick={start} disabled={going}
          className="w-full relative overflow-hidden rounded-full py-[18px] flex items-center justify-between px-7 font-black text-[17px] text-white mb-5"
          style={{ background: P, boxShadow: `0 8px 28px rgba(255,107,53,0.42)` }}>
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.18) 50%,transparent 65%)' }}
            animate={{ x: ['-120%', '220%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 0.6 }}
          />
          <span style={{ fontFamily: isRTL ? 'var(--font-noto-arabic),serif' : undefined }}>
            {going ? '...' : CTA[lang]}
          </span>
          <ChevronRight size={20} strokeWidth={3} />
        </motion.button>

        <button onClick={() => setSheet(true)}
          className="flex items-center justify-center gap-2 py-2 transition-opacity active:opacity-60">
          <Globe size={13} style={{ color: '#9A8A7A' }} />
          <span className="text-[11px] font-bold tracking-[2px]"
            style={{ color: '#9A8A7A', fontFamily: isRTL ? 'var(--font-noto-arabic),serif' : undefined }}>
            {CHANGE_LANG[lang]}
          </span>
        </button>
      </motion.div>

      <LangSheet open={sheet} onClose={() => setSheet(false)} onSelect={selectLang} current={lang} />
    </div>
  )
}
