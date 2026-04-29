'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useLang } from '@/context/LanguageContext'
import { Language } from '@/types'

const LANGUAGES: { code: Language; name: string; flag: string; welcome: string; sub: string }[] = [
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', welcome: 'Selamat datang!', sub: 'Pilih untuk melanjutkan' },
  { code: 'en', name: 'English',          flag: '🇬🇧', welcome: 'Welcome!',         sub: 'Select to continue' },
  { code: 'ar', name: 'العربية',          flag: '🇸🇦', welcome: 'أهلاً وسهلاً!',   sub: 'اختر للمتابعة' },
]

export default function LanguageModal({ onClose }: { onClose: () => void }) {
  const { setLang } = useLang()
  const [selected, setSelected] = useState<Language | null>(null)

  function pick(code: Language) {
    setSelected(code)
    setLang(code)
    setTimeout(() => {
      try { localStorage.setItem('serasa_lang_picked', '1') } catch {}
      onClose()
    }, 450)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#0D0D0D] flex flex-col items-center justify-center p-6 animate-fade-in">
      {/* Ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-60 h-60 bg-[#C44B1E]/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Logo */}
      <div className="relative w-48 h-16 mb-1">
        <Image src="/logo.jpg" alt="Serasa Restaurant" fill className="object-contain" sizes="192px" priority />
      </div>
      <p className="text-[#444] text-[10px] tracking-[4px] uppercase mb-10">Saudi Arabia</p>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="font-display text-white text-[28px] font-bold mb-2">Welcome</h1>
        <p className="text-[#555] text-sm">
          Choose your language · Pilih bahasa
          <br />
          <span className="font-arabic">اختر لغتك</span>
        </p>
      </div>

      {/* Language buttons */}
      <div className="w-full max-w-[300px] space-y-3">
        {LANGUAGES.map(l => (
          <button
            key={l.code}
            onClick={() => pick(l.code)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-300 ${
              selected === l.code
                ? 'bg-[#D4AF37] border-[#D4AF37] scale-[0.97]'
                : 'bg-[#1A1A1A] border-[#D4AF37]/15 hover:border-[#D4AF37]/50 active:scale-[0.97]'
            }`}
          >
            <span className="text-3xl flex-shrink-0">{l.flag}</span>
            <div className="text-left flex-1 min-w-0">
              <p className={`font-bold text-sm ${selected === l.code ? 'text-[#0D0D0D]' : 'text-white'}`}>
                {l.name}
              </p>
              <p className={`text-[11px] mt-0.5 ${selected === l.code ? 'text-[#0D0D0D]/65' : 'text-[#555]'}`}>
                {l.welcome}
              </p>
            </div>
            <span className={`text-xl flex-shrink-0 transition-transform ${selected === l.code ? 'text-[#0D0D0D] scale-110' : 'text-[#333]'}`}>
              {selected === l.code ? '✓' : '›'}
            </span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 flex items-center gap-3">
        <div className="h-px w-16 bg-[#D4AF37]/15" />
        <span className="text-[#333] text-[10px] tracking-widest">FROM INDONESIA FOR THE WORLD</span>
        <div className="h-px w-16 bg-[#D4AF37]/15" />
      </div>
    </div>
  )
}
