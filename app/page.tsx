'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronRight, Globe, X } from 'lucide-react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { Language } from '@/types'

const STORAGE_KEY  = 'serasa_lang'
const PRIMARY      = '#F0A030'

type LangCfg = { code: Language; flag: string; native: string; greeting: string; dir: 'ltr' | 'rtl' }

const LANGUAGES: LangCfg[] = [
  { code: 'en', flag: '🇬🇧', native: 'English',          greeting: 'Welcome',          dir: 'ltr' },
  { code: 'id', flag: '🇮🇩', native: 'Bahasa Indonesia', greeting: 'Selamat Datang',   dir: 'ltr' },
  { code: 'ar', flag: '🇸🇦', native: 'العربية',           greeting: 'أهلاً وسهلاً',      dir: 'rtl' },
]

const GREETING: Record<Language, string> = {
  id: 'Selamat Datang', en: 'Welcome', ar: 'أهلاً وسهلاً',
}
const TAGLINE: Record<Language, string> = {
  id: 'Dari Indonesia untuk dunia',
  en: 'From Indonesia to the world',
  ar: 'من إندونيسيا للعالم',
}
const CTA: Record<Language, string> = {
  id: 'Mulai Memesan', en: 'Start Ordering', ar: 'ابدأ الطلب',
}
const CHANGE_LANG: Record<Language, string> = {
  id: 'GANTI BAHASA', en: 'CHANGE LANGUAGE', ar: 'تغيير اللغة',
}
const SELECT_LANG: Record<Language, string> = {
  id: 'Pilih Bahasa', en: 'Select Language', ar: 'اختر اللغة',
}

function detectLang(): Language {
  if (typeof window === 'undefined') return 'en'
  const nav = navigator.language.toLowerCase()
  if (nav.startsWith('ar')) return 'ar'
  if (nav.startsWith('id') || nav.startsWith('ms')) return 'id'
  return 'en'
}

// ── Language Bottom Sheet ──────────────────────────────────
function LangSheet({ open, onClose, onSelect, current }: {
  open: boolean; onClose: () => void; onSelect: (l: Language) => void; current: Language
}) {
  const y = useMotionValue(0)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[6px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            drag="y" dragConstraints={{ top: 0 }} dragElastic={0.1}
            onDragEnd={(_, i) => { if (i.offset.y > 80) onClose() }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px] bg-white safe-bottom"
            style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.12)', y }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="font-black text-gray-900 text-xl">{SELECT_LANG[current]}</h2>
              <button onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Options */}
            <div className="px-5 pb-10 space-y-3">
              {LANGUAGES.map(l => {
                const active = l.code === current
                return (
                  <motion.button key={l.code} whileTap={{ scale: 0.97 }}
                    onClick={() => onSelect(l.code)} dir={l.dir}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all"
                    style={{
                      background: active ? `${PRIMARY}10` : '#FAFAF8',
                      borderColor: active ? PRIMARY : '#EEEBE6',
                    }}>
                    <span className="text-4xl leading-none flex-shrink-0">{l.flag}</span>
                    <div className={`flex-1 ${l.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                      <p className="font-black text-[16px]"
                        style={{
                          color: active ? PRIMARY : '#1A1208',
                          fontFamily: l.code === 'ar' ? 'var(--font-noto-arabic),serif' : undefined,
                        }}>
                        {l.native}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: '#9A8A7A' }}>{l.greeting}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: active ? PRIMARY : '#D0CAC4', background: active ? PRIMARY : 'transparent' }}>
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

// ── Entry Page ─────────────────────────────────────────────
export default function EntryPage() {
  const router = useRouter()
  const [table, setTable]       = useState('1')
  const [lang, setLang]         = useState<Language>('en')
  const [mounted, setMounted]   = useState(false)
  const [sheet, setSheet]       = useState(false)
  const [going, setGoing]       = useState(false)

  useEffect(() => {
    setMounted(true)
    const p = new URLSearchParams(window.location.search)
    setTable(p.get('table') ?? '1')
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null
      setLang(saved ?? detectLang())
    } catch {}
  }, [])

  function selectLang(l: Language) {
    setLang(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch {}
    setSheet(false)
  }

  function start() {
    if (going) return
    setGoing(true)
    try { localStorage.setItem(STORAGE_KEY, lang) } catch {}
    setTimeout(() => router.push(`/menu?table=${table}`), 200)
  }

  if (!mounted) return null
  const isRTL = lang === 'ar'

  return (
    <div className="min-h-dvh bg-[#FAFAF8] overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── HERO IMAGE ── */}
      <div className="relative h-[56dvh] overflow-hidden">
        <Image
          src="/hero-bg.jpg"
          alt="Indonesian Food"
          fill priority
          className="object-cover object-center"
          style={{ filter: 'brightness(0.92) saturate(1.1)' }}
          sizes="100vw"
        />

        {/* Very soft bottom fade to cream — no dark overlay */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 55%, #FAFAF8 100%)' }} />

        {/* Logo card — floating center */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-10 left-0 right-0 flex justify-center"
        >
          <div className="bg-white rounded-[20px] px-5 py-3 flex items-center gap-3"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            {/* Orange icon */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: PRIMARY }}>
              <span className="text-white text-lg">🍛</span>
            </div>
            <div className="relative w-[100px] h-[36px]">
              <Image src="/logo.png" alt="Serasa" fill className="object-contain object-left" sizes="100px" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── CONTENT ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="px-6 pt-2 pb-10"
      >
        {/* Tagline */}
        <motion.p
          key={`tag-${lang}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-sm mb-1"
          style={{ color: '#9A8A7A', fontFamily: isRTL ? 'var(--font-noto-arabic),serif' : undefined }}
        >
          {TAGLINE[lang]}
        </motion.p>

        {/* Greeting */}
        <motion.h1
          key={`h-${lang}`}
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="font-black leading-none mb-2"
          style={{
            fontSize: 'clamp(34px, 10vw, 44px)',
            color: '#1A1208',
            letterSpacing: '-0.03em',
            fontFamily: isRTL ? 'var(--font-noto-arabic),serif' : undefined,
          }}
        >
          {GREETING[lang]}
        </motion.h1>

        {/* Table */}
        <p className="mb-8" style={{ color: '#9A8A7A', fontSize: 14 }}>
          Meja #{table} · Riyadh, KSA
        </p>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={start}
          disabled={going}
          className="w-full relative overflow-hidden rounded-full py-[18px] flex items-center justify-between px-7 font-black text-[17px] text-white mb-5"
          style={{
            background: PRIMARY,
            boxShadow: `0 8px 28px rgba(240,160,48,0.42), 0 2px 6px rgba(0,0,0,0.08)`,
            letterSpacing: '0.01em',
          }}
        >
          {/* shimmer */}
          <motion.div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)' }}
            animate={{ x: ['-120%', '220%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 0.6 }}
          />
          <span style={{ fontFamily: isRTL ? 'var(--font-noto-arabic),serif' : undefined }}>
            {going ? '...' : CTA[lang]}
          </span>
          <ChevronRight size={20} strokeWidth={3} />
        </motion.button>

        {/* Change language */}
        <button onClick={() => setSheet(true)}
          className="w-full flex items-center justify-center gap-2 py-3 transition-opacity active:opacity-60">
          <Globe size={14} style={{ color: '#9A8A7A' }} />
          <span className="text-[12px] font-bold tracking-[2px]"
            style={{ color: '#9A8A7A', fontFamily: isRTL ? 'var(--font-noto-arabic),serif' : undefined }}>
            {CHANGE_LANG[lang]}
          </span>
        </button>
      </motion.div>

      {/* Language Sheet */}
      <LangSheet open={sheet} onClose={() => setSheet(false)} onSelect={selectLang} current={lang} />
    </div>
  )
}
