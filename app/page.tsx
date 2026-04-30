'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, X, Clock, Star, ChevronRight, Utensils } from 'lucide-react'
import { MenuItem, Language } from '@/types'
import { supabase } from '@/lib/supabase'
import { MOCK_MENU, IS_MOCK_MODE } from '@/lib/mock-data'
import { useLang } from '@/context/LanguageContext'
import { useCart } from '@/context/CartContext'
import { getItemName, getItemDescription, TranslationKey } from '@/lib/i18n'
import { formatPrice, calculateCartTotal, getTimeBasedPromo } from '@/lib/utils'
import LanguageModal from '@/components/LanguageModal'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

const CATEGORIES = [
  { key: 'all',     labelKey: 'all' as TranslationKey,     icon: '✦' },
  { key: 'noodles', labelKey: 'noodles' as TranslationKey, icon: '🍜' },
  { key: 'rice',    labelKey: 'rice' as TranslationKey,    icon: '🍚' },
  { key: 'main',    labelKey: 'main' as TranslationKey,    icon: '🥘' },
  { key: 'drinks',  labelKey: 'drinks' as TranslationKey,  icon: '🥤' },
  { key: 'snacks',  labelKey: 'snacks' as TranslationKey,  icon: '🥙' },
]

const FLAG: Record<Language, string> = { id: '🇮🇩', en: '🇬🇧', ar: '🇸🇦' }

// ─── Menu card (list style) ────────────────────────────────────────────────
function MenuListCard({
  item, lang, tableNumber, onAdd, qty, idx,
}: { item: MenuItem; lang: Language; tableNumber: string; onAdd: () => void; qty: number; idx: number }) {
  const router = useRouter()
  const { t } = useLang()
  const [flash, setFlash] = useState(false)
  const name = getItemName(item, lang)
  const desc = getItemDescription(item, lang)
  const price = item.promo_price ?? item.price

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation()
    setFlash(true)
    setTimeout(() => setFlash(false), 600)
    onAdd()
  }

  return (
    <div
      className="flex bg-[#1A1A1A] rounded-2xl overflow-hidden border border-white/5 cursor-pointer group"
      style={{
        opacity: 0,
        animation: `menuCardIn 0.45s cubic-bezier(0.16,1,0.3,1) ${idx * 60}ms forwards`,
      }}
      onClick={() => router.push(`/menu/${item.id}?table=${tableNumber}`)}
    >
      {/* Image */}
      <div className="relative w-[96px] flex-shrink-0 overflow-hidden">
        <Image
          src={item.image || `https://placehold.co/200x200/222/D4AF37?text=${encodeURIComponent(name[0] ?? '?')}`}
          alt={name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="96px"
        />
        {/* Dark-to-transparent fade on right edge */}
        <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-r from-transparent to-[#1A1A1A]" />
        {item.is_best_seller && (
          <div className="absolute top-1.5 left-1.5 bg-[#D4AF37] text-[#0D0D0D] text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">
            ⭐
          </div>
        )}
        {item.promo_price && (
          <div className="absolute bottom-1.5 left-1.5 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">
            PROMO
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-3 py-3 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-semibold text-white text-[13px] leading-snug line-clamp-1 group-hover:text-[#D4AF37] transition-colors duration-200">
            {name}
          </h3>
          {desc && (
            <p className="text-[#555] text-[11px] mt-0.5 line-clamp-1 leading-relaxed">{desc}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-0.5 text-[#444] text-[10px]">
              <Clock size={9} />{item.cook_time}{t('minutes')}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2.5">
          <div>
            {item.promo_price ? (
              <div>
                <span className="text-[#444] text-[10px] line-through mr-1">{formatPrice(item.price)}</span>
                <span className="text-[#D4AF37] font-black text-sm">{formatPrice(price)}</span>
              </div>
            ) : (
              <span className="text-[#D4AF37] font-black text-sm">{formatPrice(item.price)}</span>
            )}
          </div>

          <button
            onClick={handleAdd}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base transition-all duration-200 ${
              flash
                ? 'bg-green-400 text-white scale-125'
                : qty > 0
                  ? 'bg-[#D4AF37] text-[#0D0D0D] shadow-[0_2px_14px_rgba(212,175,55,0.45)]'
                  : 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 active:scale-90'
            }`}
          >
            {flash ? '✓' : qty > 0 ? qty : '+'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const router = useRouter()
  const { lang, t, isRTL } = useLang()
  const { items: cartItems, addItem, setPromo, totalItems } = useCart()

  const [tableNumber, setTableNumber] = useState('1')
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showLangModal, setShowLangModal] = useState(false)
  const [cartBounce, setCartBounce] = useState(false)

  // Always show language modal on every scan/page load
  useEffect(() => {
    setShowLangModal(true)
  }, [])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
  }, [])

  useEffect(() => { setPromo(getTimeBasedPromo()) }, [setPromo])

  // Fetch menu from Supabase or mock
  const fetchMenu = useCallback(async () => {
    setLoading(true)
    if (IS_MOCK_MODE) {
      // Small delay for realistic feel
      await new Promise(r => setTimeout(r, 300))
      setMenu(MOCK_MENU)
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('menu').select('*')
        .eq('restaurant_id', RESTAURANT_ID)
        .eq('is_available', true)
        .order('is_best_seller', { ascending: false })
      if (!error && data) setMenu(data as MenuItem[])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchMenu() }, [fetchMenu])

  function handleAdd(item: MenuItem) {
    addItem(item)
    setCartBounce(true)
    setTimeout(() => setCartBounce(false), 400)
  }

  const filtered = menu.filter(item => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory
    const name = getItemName(item, lang).toLowerCase()
    return matchCat && (!search || name.includes(search.toLowerCase()))
  })

  const hero = menu.find(i => i.is_best_seller) ?? menu[0]
  const { total } = calculateCartTotal(cartItems)

  const tableWelcome: Record<Language, string> = {
    id: 'Selamat datang! Silakan pilih menu',
    en: 'Welcome! Browse our menu',
    ar: 'أهلاً! تصفح قائمتنا',
  }

  return (
    <div className="min-h-dvh bg-[#0D0D0D]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Language modal */}
      {showLangModal && <LanguageModal onClose={() => setShowLangModal(false)} />}

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 right-0 w-96 h-96 rounded-full bg-[#D4AF37]/5 blur-[120px]" />
        <div className="absolute bottom-40 -left-20 w-64 h-64 rounded-full bg-[#C44B1E]/4 blur-[80px]" />
      </div>

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#0D0D0D]/93 backdrop-blur-xl border-b border-[#D4AF37]/12">
        <div className="flex items-center gap-3 px-4 py-3">
          {!showSearch ? (
            <>
              {/* Logo */}
              <div className="relative h-8 w-[90px] flex-shrink-0">
                <Image src="/logo.png" alt="Serasa" fill className="object-contain object-left" sizes="90px" />
              </div>
              <div className="h-4 w-px bg-[#D4AF37]/15 mx-0.5" />

              {/* Language flag — re-triggers modal */}
              <button
                onClick={() => setShowLangModal(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1A1A1A] border border-[#D4AF37]/12 hover:border-[#D4AF37]/35 transition-all active:scale-95"
                title="Change language"
              >
                <span className="text-base leading-none">{FLAG[lang]}</span>
                <span className="text-[#555] text-[10px] font-semibold uppercase">{lang}</span>
              </button>

              <div className="flex-1" />

              <button
                onClick={() => setShowSearch(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1A1A1A] border border-[#D4AF37]/12 text-[#777] hover:text-[#D4AF37] hover:border-[#D4AF37]/35 transition-all"
              >
                <Search size={14} />
              </button>
            </>
          ) : (
            <div className="flex-1 flex items-center gap-2 bg-[#1A1A1A] rounded-full px-4 py-2 border border-[#D4AF37]/25 animate-fade-in">
              <Search size={13} className="text-[#888] flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('search')}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#555]"
                autoFocus
              />
              <button onClick={() => { setShowSearch(false); setSearch('') }}
                className="text-[#666] hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{ animationDelay: `${i * 40}ms` }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 active:scale-95 ${
                activeCategory === cat.key
                  ? 'bg-[#D4AF37] text-[#0D0D0D] shadow-[0_2px_14px_rgba(212,175,55,0.35)]'
                  : 'bg-[#1A1A1A] text-[#666] border border-[#D4AF37]/10 hover:border-[#D4AF37]/35 hover:text-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{t(cat.labelKey)}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── TABLE CTA BANNER ────────────────────────────────────────── */}
      {!showSearch && (
        <div className="mx-4 mt-4 animate-fade-up" style={{ animationDelay: '80ms' }}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1A1A0A] via-[#1E1A08] to-[#1A1A0A] border border-[#D4AF37]/25 px-4 py-3.5 flex items-center justify-between">
            {/* Shimmer line */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/5 to-transparent translate-x-[-100%] animate-[shimmer_3s_ease_infinite]" />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                <Utensils size={18} className="text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-[#D4AF37] font-black text-xl leading-none tracking-tight">
                  {t('table')} {tableNumber}
                </p>
                <p className="text-[#777] text-[11px] mt-0.5">{tableWelcome[lang]}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      {hero && !search && activeCategory === 'all' && (
        <div className="px-4 pt-3 animate-fade-up" style={{ animationDelay: '140ms' }}>
          <div
            className="relative h-52 rounded-3xl overflow-hidden cursor-pointer group shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
            onClick={() => router.push(`/menu/${hero.id}?table=${tableNumber}`)}
          >
            <Image
              src={hero.image || `https://placehold.co/800x450/1a1a1a/D4AF37?text=${encodeURIComponent(getItemName(hero, lang))}`}
              alt={getItemName(hero, lang)}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D]/75 via-transparent to-transparent" />

            <span className="absolute top-4 left-4 bg-[#D4AF37] text-[#0D0D0D] text-[10px] font-black px-3 py-1 rounded-full tracking-wide">
              🔥 {t('bestSeller').toUpperCase()}
            </span>

            <div className="absolute bottom-0 left-0 p-5">
              <p className="text-[#D4AF37]/70 text-[10px] font-semibold tracking-[3px] uppercase mb-1">Featured</p>
              <h2 className="font-display text-white text-2xl font-bold leading-tight">
                {getItemName(hero, lang)}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[#D4AF37] font-black text-lg">{formatPrice(hero.price)}</span>
                <span className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={10} className="text-[#D4AF37] fill-[#D4AF37]" />)}
                </span>
              </div>
            </div>

            <button
              onClick={e => { e.stopPropagation(); handleAdd(hero) }}
              className="absolute bottom-5 right-5 w-11 h-11 rounded-full bg-[#D4AF37] text-[#0D0D0D] flex items-center justify-center font-black text-xl shadow-[0_4px_20px_rgba(212,175,55,0.55)] active:scale-90 transition-transform"
            >
              +
            </button>
            <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <ChevronRight size={13} className="text-white" />
            </div>
          </div>
        </div>
      )}

      {/* ── MENU LIST ───────────────────────────────────────────────── */}
      <main id="menu-list" className="px-4 pt-4 pb-36 space-y-2.5">
        {!search && (
          <div className="flex items-center justify-between mb-1">
            <span className="text-white font-semibold text-sm">
              {activeCategory === 'all'
                ? (lang === 'ar' ? 'القائمة الكاملة' : lang === 'id' ? 'Semua Menu' : 'Full Menu')
                : t(CATEGORIES.find(c => c.key === activeCategory)?.labelKey ?? 'all')}
            </span>
            <span className="text-[#444] text-xs">{filtered.length} item</span>
          </div>
        )}

        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-[96px] rounded-2xl skeleton" style={{ animationDelay: `${i * 80}ms` }} />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4 animate-bounce">🍽️</span>
            <p className="text-[#555] text-sm">{t('noItems')}</p>
          </div>
        ) : (
          filtered.map((item, idx) => (
            <MenuListCard
              key={item.id}
              item={item}
              lang={lang}
              tableNumber={tableNumber}
              onAdd={() => handleAdd(item)}
              qty={cartItems.find(i => i.id === item.id)?.qty ?? 0}
              idx={idx}
            />
          ))
        )}
      </main>

      {/* ── CART BUTTON ─────────────────────────────────────────────── */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 safe-bottom z-40">
          <button
            onClick={() => router.push(`/cart?table=${tableNumber}`)}
            style={{ animation: cartBounce ? 'cartBounce 0.4s cubic-bezier(0.36,0.07,0.19,0.97)' : undefined }}
            className="w-full bg-[#D4AF37] text-[#0D0D0D] rounded-2xl py-4 flex items-center justify-between px-5 font-bold shadow-[0_8px_40px_rgba(212,175,55,0.45)] active:scale-[0.97] transition-transform"
          >
            <div className="flex items-center gap-2.5">
              <span className="bg-[#0D0D0D]/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-black">
                {totalItems}
              </span>
              <span className="font-bold text-sm">{t('cart')}</span>
            </div>
            <span className="font-black text-base">{formatPrice(total)}</span>
          </button>
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes menuCardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes cartBounce {
          0%,100% { transform: scale(1); }
          30%      { transform: scale(1.04); }
          60%      { transform: scale(0.97); }
        }
        @keyframes shimmer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}
