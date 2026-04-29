'use client'

import { useLang } from '@/context/LanguageContext'
import { Language } from '@/types'

const LANGS: { code: Language; label: string; flag: string }[] = [
  { code: 'id', label: 'ID', flag: '🇮🇩' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'ar', label: 'عر', flag: '🇸🇦' },
]

export default function LanguageToggle() {
  const { lang, setLang } = useLang()

  return (
    <div className="flex items-center gap-1 bg-obsidian-light rounded-full p-1 border border-gold-border">
      {LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
            lang === l.code
              ? 'bg-gold text-obsidian shadow-gold-sm'
              : 'text-ink-muted hover:text-ink hover:bg-obsidian-surface'
          }`}
          aria-label={`Switch to ${l.label}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
