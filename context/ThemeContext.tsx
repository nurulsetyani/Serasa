'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeCtx {
  theme: Theme
  toggle: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeCtx>({ theme: 'light', toggle: () => {}, isDark: false })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('serasa_theme') as Theme | null
      if (saved === 'dark' || saved === 'light') {
        setTheme(saved)
        document.documentElement.classList.toggle('theme-dark', saved === 'dark')
      }
    } catch {}
  }, [])

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.classList.toggle('theme-dark', next === 'dark')
    try { localStorage.setItem('serasa_theme', next) } catch {}
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
