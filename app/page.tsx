'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, X, Clock, Star, ChevronRight } from 'lucide-react'
import { MenuItem } from '@/types'
import { Language } from '@/types'
import { supabase } from '@/lib/supabase'
import { MOCK_MENU, IS_MOCK_MODE } from '@/lib/mock-data'
import { useLang } from '@/context/LanguageContext'
import { useCart } from '@/context/CartContext'
import { getItemName, getItemDescription, TranslationKey } from '@/lib/i18n'
import { formatPrice, calculateCartTotal, getTimeBasedPromo } from '@/lib/utils'
import LanguageToggle from '@/components/LanguageToggle'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

const CATEGORIES = [
  { key: 'all',     labelKey: 'all' as TranslationKey,     icon: '✦' },
  { key: 'noodles', labelKey: 'noodles' as TranslationKey, icon: '🍜' },
  { key: 'rice',    labelKey: 'rice' as TranslationKey,    icon: '🍚' },
  { key: 'main',    labelKey: 'main' as TranslationKey,    icon: '🥘' },
  { key: 'drinks',  labelKey: 'drinks' as TranslationKey,  icon: '🥤' },
  { key: 'snacks',  labelKey: 'snacks' as TranslationKey,  icon: '🥙' },
]

interface CardProps {
  item: MenuItem
  lang: Language
  tableNumber: string
  onAdd: () => void
  qty: number
  idx: number
}

function MenuListCard({ item, lang, tableNumber, onAdd, qty, idx }: CardProps) {
  const router = useRouter()
  const { t } = useLang()
  const name = getItemName(item, lang)
  const desc = getItemDescription(item, lang)
  const displayPrice = item.promo_price ?? item.price

  return (
    <div
      className="flex gap-0 bg-[#1A1A1A] rounded-2xl overflow-hidden border border-white/5 hover:border-[#D4AF37]/25 transition-all duration-300 cursor-pointer active:scale-[0.98]"
      style={{ opacity: 0, animation: `fadeUp 0.4s ease ${idx * 50}ms forwards` }}
      onClick={() => router.push(`/menu/${item.id}?table=${tableNumber}`)}
    >
      {/* Image */}
      <div className="relative w-[100px] h-[100px] flex-shrink-0">
        <Image
          src={item.image || `https://placehold.co/200x200/222/D4AF37?text=${encodeURIComponent(name[0] ?? '?')}`}
          alt={name}
          fill
          className="object-cover"
          sizes="100px"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1A1A1A]/20" />
        {item.is_best_seller && (
          <div className="absolute top-2 left-2">
            <span className="bg-[#D4AF37] text-[#0D0D0D] text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">⭐</span>
          </div>
        )}
        {item.promo_price && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">PROMO</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-semibold text-white text-[13px] leading-snug line-clamp-1">{name}</h3>
          {desc && <p className="text-[#666] text-[11px] mt-0.5 line-clamp-1 leading-relaxed">{desc}</p>}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="flex items-center gap-1 text-[#555] text-[10px]">
              <Clock size={9} />
              {item.cook_time}{t('minutes')}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            {item.promo_price ? (
              <div className="flex flex-col">
                <span className="text-[#444] text-[10px] line-through leading-none">{formatPrice(item.price)}</span>
                <span className="text-[#D4AF37] font-bold text-sm">{formatPrice(displayPrice)}</span>
              </div>
            ) : (
              <span className="text-[#D4AF37] font-bold text-sm">{formatPrice(item.price)}</span>
            )}
          </div>

          <button
            onClick={e => { e.stopPropagation(); onAdd() }}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base transition-all duration-200 active:scale-90 ${
              qty > 0
                ? 'bg-[#D4AF37] text-[#0D0D0D] shadow-[0_2px_12px_rgba(212,175,55,0.4)]'
                : 'bg-[#D4AF37]/12 text-[#D4AF37] border border-[#D4AF37]/25 hover:bg-[#D4AF37]/20'
            }`}
          >
            {qty > 0 ? qty : '+'}
          </button>
        </div>
      </div>
    </div>
  )
}

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

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
  }, [])

  useEffect(() => { setPromo(getTimeBasedPromo()) }, [setPromo])

  useEffect(() => {
    async function fetchMenu() {
      setLoading(true)
      if (IS_MOCK_MODE) {
        setMenu(MOCK_MENU)
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('menu').select('*')
        .eq('restaurant_id', RESTAURANT_ID)
        .eq('is_available', true)
        .order('is_best_seller', { ascending: false })
      if (!error && data) setMenu(data as MenuItem[])
      setLoading(false)
    }
    fetchMenu()
  }, [])

  const filtered = menu.filter(item => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory
    const name = getItemName(item, lang).toLowerCase()
    return matchCat && (!search || name.includes(search.toLowerCase()))
  })

  const hero = menu.find(i => i.is_best_seller) ?? menu[0]
  const { total } = calculateCartTotal(cartItems)

  return (
    <div className="min-h-dvh bg-[#0D0D0D]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 right-0 w-80 h-80 rounded-full bg-[#D4AF37]/6 blur-[100px]" />
        <div className="absolute bottom-40 -left-20 w-60 h-60 rounded-full bg-[#C44B1E]/5 blur-[80px]" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0D0D0D]/92 backdrop-blur-xl border-b border-[#D4AF37]/12">
        <div className="flex items-center gap-3 px-4 py-3">
          {!showSearch ? (
            <>
              {/* Real Logo */}
              <div className="relative h-8 w-[90px] flex-shrink-0">
                <Image src="/logo.jpg" alt="Serasa" fill className="object-contain object-left" sizes="90px" />
              </div>
              <div className="h-4 w-px bg-[#D4AF37]/20" />
              <span className="text-[#666] text-[11px] flex-1">
                {t('table')} {tableNumber}
              </span>
              <div className="flex items-center gap-2">
                <LanguageToggle />
                <button
                  onClick={() => setShowSearch(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1A1A1A] border border-[#D4AF37]/15 text-[#888] hover:text-[#D4AF37] transition-colors"
                >
                  <Search size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center gap-2 bg-[#1A1A1A] rounded-full px-4 py-2 border border-[#D4AF37]/20 animate-fade-in">
              <Search size={13} className="text-[#888] flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('search')}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#555]"
                autoFocus
              />
              <button onClick={() => { setShowSearch(false); setSearch('') }}>
                <X size={14} className="text-[#888]" />
              </button>
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                activeCategory === cat.key
                  ? 'bg-[#D4AF37] text-[#0D0D0D] shadow-[0_2px_12px_rgba(212,175,55,0.3)]'
                  : 'bg-[#1A1A1A] text-[#666] border border-[#D4AF37]/12 hover:border-[#D4AF37]/30 hover:text-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{t(cat.labelKey)}</span>
            </button>
          ))}
        </div>
      </header>

      {/* HERO BANNER */}
      {hero && !search && activeCategory === 'all' && (
        <div className="px-4 pt-4">
          <div
            className="relative h-52 rounded-3xl overflow-hidden cursor-pointer group"
            onClick={() => router.push(`/menu/${hero.id}?table=${tableNumber}`)}
          >
            <Image
              src={hero.image || `https://placehold.co/800x450/1a1a1a/D4AF37?text=${encodeURIComponent(getItemName(hero, lang))}`}
              alt={getItemName(hero, lang)}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              priority
            />
            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D]/70 via-transparent to-transparent" />

            {/* Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5">
              <span className="bg-[#D4AF37] text-[#0D0D0D] text-[10px] font-black px-3 py-1 rounded-full tracking-wide">
                🔥 {t('bestSeller').toUpperCase()}
              </span>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 p-5">
              <p className="text-[#D4AF37]/80 text-[11px] font-semibold tracking-widest uppercase mb-1">
                Featured
              </p>
              <h2 className="font-display text-white text-2xl font-bold leading-tight">
                {getItemName(hero, lang)}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[#D4AF37] font-bold text-lg">{formatPrice(hero.price)}</span>
                <span className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={10} className="text-[#D4AF37] fill-[#D4AF37]" />)}
                </span>
              </div>
            </div>

            {/* Add button */}
            <button
              onClick={e => { e.stopPropagation(); addItem(hero) }}
              className="absolute bottom-5 right-5 w-11 h-11 rounded-full bg-[#D4AF37] text-[#0D0D0D] flex items-center justify-center font-black text-xl shadow-[0_4px_20px_rgba(212,175,55,0.5)] active:scale-90 transition-transform"
            >
              +
            </button>

            {/* Arrow */}
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <ChevronRight size={14} className="text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Section label */}
      {!search && (
        <div className="px-4 pt-5 pb-2 flex items-center justify-between">
          <span className="text-white font-semibold text-sm">
            {activeCategory === 'all' ? 'Semua Menu' : t(CATEGORIES.find(c => c.key === activeCategory)?.labelKey ?? 'all')}
          </span>
          <span className="text-[#555] text-xs">{filtered.length} item</span>
        </div>
      )}

      {/* MENU LIST */}
      <main className="px-4 pb-32 space-y-2.5">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="skeleton h-[100px] rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🍽️</span>
            <p className="text-[#666]">{t('noItems')}</p>
          </div>
        ) : (
          filtered.map((item, idx) => (
            <MenuListCard
              key={item.id}
              item={item}
              lang={lang}
              tableNumber={tableNumber}
              onAdd={() => addItem(item)}
              qty={cartItems.find(i => i.id === item.id)?.qty ?? 0}
              idx={idx}
            />
          ))
        )}
      </main>

      {/* CART BUTTON */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 safe-bottom z-40">
          <button
            onClick={() => router.push(`/cart?table=${tableNumber}`)}
            className="w-full bg-[#D4AF37] text-[#0D0D0D] rounded-2xl py-4 flex items-center justify-between px-5 font-bold shadow-[0_8px_40px_rgba(212,175,55,0.4)] active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2.5">
              <span className="bg-[#0D0D0D]/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-black">
                {totalItems}
              </span>
              <span className="font-bold">{t('cart')}</span>
            </div>
            <span className="font-black text-base">{formatPrice(total)}</span>
          </button>
        </div>
      )}
    </div>
  )
}
