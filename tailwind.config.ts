import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E8CC5A',
          dark: '#B8960C',
          muted: 'rgba(212,175,55,0.12)',
          border: 'rgba(212,175,55,0.25)',
        },
        obsidian: {
          DEFAULT: '#0D0D0D',
          light: '#1A1A1A',
          surface: '#222222',
          elevated: '#2A2A2A',
        },
        ink: {
          DEFAULT: '#F5F5F0',
          muted: '#9A9A8A',
          faint: '#5A5A4A',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-noto-arabic)', 'serif'],
      },
      animation: {
        'shimmer': 'shimmer 2.5s linear infinite',
        'fade-up': 'fadeUp 0.4s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(212,175,55,0.0)' },
          '50%': { boxShadow: '0 0 24px 4px rgba(212,175,55,0.18)' },
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #E8CC5A 50%, #B8960C 100%)',
        'dark-gradient': 'linear-gradient(180deg, #1A1A1A 0%, #0D0D0D 100%)',
      },
      boxShadow: {
        'gold-sm': '0 2px 12px rgba(212,175,55,0.12)',
        'gold-md': '0 4px 24px rgba(212,175,55,0.18)',
        'gold-lg': '0 8px 48px rgba(212,175,55,0.22)',
        'dark-card': '0 4px 24px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}

export default config
