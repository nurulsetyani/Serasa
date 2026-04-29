'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Language } from '@/types'
import { t, TranslationKey, detectBrowserLanguage } from '@/lib/i18n'

interface LanguageContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey) => string
  isRTL: boolean
  dir: 'ltr' | 'rtl'
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'serasa_lang'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null
      const resolved = saved ?? detectBrowserLanguage()
      setLangState(resolved)
    } catch {}
  }, [])

  useEffect(() => {
    // Update HTML dir and lang attribute
    document.documentElement.setAttribute('lang', lang)
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
  }, [lang])

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang)
    try { localStorage.setItem(STORAGE_KEY, newLang) } catch {}
  }, [])

  const translate = useCallback((key: TranslationKey) => t(lang, key), [lang])

  const isRTL = lang === 'ar'
  const dir = isRTL ? 'rtl' : 'ltr'

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translate, isRTL, dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider')
  return ctx
}
