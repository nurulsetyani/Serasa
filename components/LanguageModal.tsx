'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useLang } from '@/context/LanguageContext'
import { Language } from '@/types'

const LANGUAGES: {
  code: Language; name: string; flag: string; welcome: string
}[] = [
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', welcome: 'Selamat datang!' },
  { code: 'en', name: 'English',          flag: '🇬🇧', welcome: 'Welcome!' },
  { code: 'ar', name: 'العربية',          flag: '🇸🇦', welcome: '!أهلاً وسهلاً' },
]

export default function LanguageModal({ onClose }: { onClose: () => void }) {
  const { setLang } = useLang()
  const [selected, setSelected] = useState<Language | null>(null)

  function pick(code: Language) {
    setSelected(code)
    setLang(code)
    setTimeout(onClose, 420)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#0D0D0D] flex flex-col items-center justify-between py-10 px-6 overflow-y-auto animate-fade-in">

      {/* ── Logo — no white box, large PNG ─────────────────────── */}
      <div className="flex flex-col items-center">
        <div className="relative w-[280px] h-[126px]">
          <Image
            src="/logo.png"
            alt="Serasa Restaurant"
            fill
            className="object-contain"
            sizes="280px"
            priority
          />
        </div>
        <p className="text-[#444] text-[11px] tracking-[4px] uppercase mt-3 font-medium">
          Saudi Arabia
        </p>
      </div>

      {/* ── Heading + language buttons ──────────────────────────── */}
      <div className="flex flex-col items-center w-full max-w-[340px]">
        <h1 className="font-display text-white text-[44px] font-bold text-center leading-none mb-4">
          Welcome
        </h1>
        <p className="text-[#666] text-sm text-center leading-relaxed mb-8">
          Choose your language · Pilih bahasa
          <br />
          <span className="font-arabic text-[#555]">اختر لغتك</span>
        </p>

        <div className="w-full space-y-3">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => pick(l.code)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                selected === l.code
                  ? 'bg-[#D4AF37] border-[#D4AF37] scale-[0.97]'
                  : 'bg-[#111] border-[#D4AF37]/30 hover:border-[#D4AF37]/60 active:scale-[0.97]'
              }`}
            >
              <span className="text-[38px] leading-none flex-shrink-0">{l.flag}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-base leading-tight ${
                  selected === l.code ? 'text-[#0D0D0D]' : 'text-white'
                }`}>{l.name}</p>
                <p className={`text-[12px] mt-0.5 ${
                  selected === l.code ? 'text-[#0D0D0D]/65' : 'text-[#555]'
                }`}>{l.welcome}</p>
              </div>
              <span className={`text-xl flex-shrink-0 font-light ${
                selected === l.code ? 'text-[#0D0D0D]' : 'text-[#333]'
              }`}>
                {selected === l.code ? '✓' : '›'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="h-px w-14 bg-[#222]" />
        <p className="text-[#333] text-[10px] tracking-[2.5px] uppercase font-medium text-center">
          From Indonesia For The World
        </p>
        <div className="h-px w-14 bg-[#222]" />
      </div>
    </div>
  )
}
