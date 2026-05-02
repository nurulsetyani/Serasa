'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, X, Clock, Minus, Plus, ShoppingCart, ChevronRight, Flame, Star } from 'lucide-react'
import { MenuItem, Language } from '@/types'
import { supabase } from '@/lib/supabase'
import { MOCK_MENU, IS_MOCK_MODE } from '@/lib/mock-data'
import { useLang } from '@/context/LanguageContext'
import { useCart } from '@/context/CartContext'
import { getItemName, getItemDescription, TranslationKey } from '@/lib/i18n'
import { formatPrice, calculateCartTotal } from '@/lib/utils'
import LanguageModal from '@/components/LanguageModal'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

const CATEGORIES = [
  { key: 'all',        labelKey: 'all' as TranslationKey,        icon: '✦'  },
  { key: 'signature',  labelKey: 'signature' as TranslationKey,  icon: '⭐' },
  { key: 'mix_rice',   labelKey: 'mix_rice' as TranslationKey,   icon: '🍱' },
  { key: 'fried_rice', labelKey: 'fried_rice' as TranslationKey, icon: '🍳' },
  { key: 'noodles',    labelKey: 'noodles' as TranslationKey,    icon: '🍜' },
  { key: 'satay',      labelKey: 'satay' as TranslationKey,      icon: '🍢' },
  { key: 'appetizer',  labelKey: 'appetizer' as TranslationKey,  icon: '🥗' },
  { key: 'meat',       labelKey: 'meat' as TranslationKey,       icon: '🥩' },
  { key: 'chicken',    labelKey: 'chicken' as TranslationKey,    icon: '🍗' },
  { key: 'bebek',      labelKey: 'bebek' as TranslationKey,      icon: '🦆' },
  { key: 'rice_bowl',  labelKey: 'rice_bowl' as TranslationKey,  icon: '🍚' },
  { key: 'seafood',    labelKey: 'seafood' as TranslationKey,    icon: '🦐' },
  { key: 'soup',       labelKey: 'soup' as TranslationKey,       icon: '🍲' },
  { key: 'extra',      labelKey: 'extra' as TranslationKey,      icon: '➕' },
  { key: 'drinks',     labelKey: 'drinks' as TranslationKey,     icon: '🥤' },
]

const FLAG: Record<Language, string> = { id: '🇮🇩', en: '🇬🇧', ar: '🇸🇦' }

// ── Skeleton Card ──────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="h-36 bg-gray-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-100 rounded-full animate-pulse w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full animate-pulse w-full" />
        <div className="h-3 bg-gray-100 rounded-full animate-pulse w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-4 bg-gray-100 rounded-full animate-pulse w-16" />
          <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// ── Food Card ──────────────────────────────────────────────
function FoodCard({
  item, lang, tableNumber, onAdd, onDecrease, qty, idx,
}: {
  item: MenuItem; lang: Language; tableNumber: string
  onAdd: () => void; onDecrease: () => void; qty: number; idx: number
}) {
  const router = useRouter()
  const name = getItemName(item, lang)
  const desc = getItemDescription(item, lang)
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md active:scale-[0.98] cursor-pointer"
      style={{
        opacity: 0,
        animation: `cardIn 0.4s cubic-bezier(0.16,1,0.3,1) ${idx * 50}ms forwards`,
      }}
      onClick={() => router.push(`/menu/${item.id}?table=${tableNumber}`)}
    >
      {/* Image */}
      <div className="relative h-36 bg-gray-100 overflow-hidden">
        {!imgError ? (
          <Image
            src={item.image || `https://placehold.co/400x300/FFF7ED/F97316?text=${encodeURIComponent(name)}`}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            sizes="(max-width: 768px) 50vw, 33vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl bg-orange-50">🍽️</div>
        )}

        {/* Gradient overlay bottom */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.is_best_seller && (
            <span className="flex items-center gap-0.5 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              <Star size={8} fill="white" /> Best Seller
            </span>
          )}
        </div>

        {/* Cook time */}
        <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-black/40 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-full">
          <Clock size={8} />
          {item.cook_time}m
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">
          {name}
        </h3>
        {desc && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
            {desc}
          </p>
        )}

        {/* Price + Add */}
        <div className="flex items-center justify-between mt-3" onClick={e => e.stopPropagation()}>
          <span className="text-orange-500 font-bold text-sm">{formatPrice(item.price)}</span>

          {qty === 0 ? (
            <button
              onClick={e => { e.stopPropagation(); onAdd() }}
              className="w-8 h-8 bg-orange-500 hover:bg-orange-600 active:scale-90 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm transition-all duration-150"
            >
              +
            </button>
          ) : (
            <div
              className="flex items-center gap-2"
              style={{ animation: 'stepperIn 0.2s cubic-bezier(0.16,1,0.3,1)' }}
            >
              <button
                onClick={e => { e.stopPropagation(); onDecrease() }}
                className="w-7 h-7 border-2 border-orange-500 text-orange-500 rounded-full flex items-center justify-center active:scale-90 transition-transform hover:bg-orange-50"
              >
                <Minus size={12} strokeWidth={2.5} />
              </button>
              <span className="text-gray-900 font-bold text-sm w-4 text-center">{qty}</span>
              <button
                onClick={e => { e.stopPropagation(); onAdd() }}
                className="w-7 h-7 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center active:scale-90 transition-all"
              >
                <Plus size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Hero Banner ────────────────────────────────────────────
function HeroBanner({
  item, lang, tableNumber, onAdd, qty,
}: {
  item: MenuItem; lang: Language; tableNumber: string; onAdd: () => void; qty: number
}) {
  const router = useRouter()
  const name = getItemName(item, lang)

  return (
    <div
      className="relative h-48 rounded-2xl overflow-hidden shadow-md cursor-pointer mx-4 mt-4"
      onClick={() => router.push(`/menu/${item.id}?table=${tableNumber}`)}
    >
      <Image
        src={item.image || `https://placehold.co/800x400/FFF7ED/F97316?text=${encodeURIComponent(name)}`}
        alt={name}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        <span className="self-start bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
          🔥 Best Seller
        </span>
        <div>
          <p className="text-orange-300 text-[10px] font-semibold tracking-widest uppercase mb-1">
            Featured Today
          </p>
          <h2 className="text-white font-bold text-xl leading-tight">{name}</h2>
          <div className="flex items-center justify-between mt-2">
            <span className="text-orange-400 font-black text-lg">{formatPrice(item.price)}</span>
            <button
              onClick={e => { e.stopPropagation(); onAdd() }}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md active:scale-95 transition-all"
            >
              <Plus size={14} /> Tambah
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function MenuPage() {
  const router = useRouter()
  const { lang, t, isRTL } = useLang()
  const { items: cartItems, addItem, updateQty, totalItems } = useCart()

  const [tableNumber, setTableNumber]     = useState('1')
  const [menu, setMenu]                   = useState<MenuItem[]>([])
  const [loading, setLoading]             = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch]               = useState('')
  const [showSearch, setShowSearch]       = useState(false)
  const [showLangModal, setShowLangModal] = useState(false)
  const [cartBounce, setCartBounce]       = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
    const saved = localStorage.getItem('serasa_lang')
    if (!saved) setShowLangModal(true)
  }, [])

  const fetchMenu = useCallback(async () => {
    setLoading(true)
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 400))
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
    setTimeout(() => setCartBounce(false), 350)
  }

  function handleDecrease(item: MenuItem) {
    const current = cartItems.find(i => i.id === item.id)?.qty ?? 0
    updateQty(item.id, current - 1)
  }

  const filtered = menu.filter(item => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory
    const name = getItemName(item, lang).toLowerCase()
    return matchCat && (!search || name.includes(search.toLowerCase()))
  })

  const hero = menu.find(i => i.is_best_seller) ?? menu[0]
  const total = calculateCartTotal(cartItems)

  return (
    <div className="min-h-dvh bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {showLangModal && <LanguageModal onClose={() => setShowLangModal(false)} />}

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          {!showSearch ? (
            <>
              {/* Logo */}
              <div className="relative h-8 w-[90px] flex-shrink-0">
                <Image src="/logo.png" alt="Serasa" fill className="object-contain object-left" sizes="90px" />
              </div>

              {/* Table badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-100 rounded-full">
                <span className="text-orange-500 text-[10px] font-bold">
                  {t('table')} {tableNumber}
                </span>
              </div>

              <div className="flex-1" />

              {/* Language */}
              <button
                onClick={() => setShowLangModal(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-base hover:bg-gray-100 active:scale-95 transition-all"
              >
                {FLAG[lang]}
              </button>

              {/* Search */}
              <button
                onClick={() => setShowSearch(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 active:scale-95 transition-all"
              >
                <Search size={14} />
              </button>
            </>
          ) : (
            <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
              <Search size={14} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('search')}
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                autoFocus
              />
              <button onClick={() => { setShowSearch(false); setSearch('') }}
                className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 flex-shrink-0 ${
                activeCategory === cat.key
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-200 hover:text-orange-500'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{t(cat.labelKey)}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      {hero && !search && activeCategory === 'all' && (
        <HeroBanner
          item={hero}
          lang={lang}
          tableNumber={tableNumber}
          onAdd={() => handleAdd(hero)}
          qty={cartItems.find(i => i.id === hero.id)?.qty ?? 0}
        />
      )}

      {/* ── MENU GRID ── */}
      <main className="px-4 pt-4 pb-36">
        {!search && (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-gray-900 font-semibold text-sm">
              {activeCategory === 'all'
                ? (lang === 'ar' ? 'القائمة الكاملة' : lang === 'id' ? 'Semua Menu' : 'Full Menu')
                : t(CATEGORIES.find(c => c.key === activeCategory)?.labelKey ?? 'all')}
            </h2>
            <span className="text-gray-400 text-xs">{filtered.length} item</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">🍽️</span>
            <p className="text-gray-400 text-sm">{t('noItems')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item, idx) => (
              <FoodCard
                key={item.id}
                item={item}
                lang={lang}
                tableNumber={tableNumber}
                onAdd={() => handleAdd(item)}
                onDecrease={() => handleDecrease(item)}
                qty={cartItems.find(i => i.id === item.id)?.qty ?? 0}
                idx={idx}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── FLOATING CART ── */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 safe-bottom z-40">
          <button
            onClick={() => router.push(`/cart?table=${tableNumber}`)}
            className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white rounded-2xl shadow-lg shadow-orange-200 transition-all duration-200 overflow-hidden"
            style={{
              animation: cartBounce ? 'cartPop 0.35s cubic-bezier(0.36,0.07,0.19,0.97)' : 'cartSlideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl w-8 h-8 flex items-center justify-center">
                  <ShoppingCart size={16} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="text-white/80 text-[10px] leading-none">{t('cart')}</p>
                  <p className="text-white font-bold text-sm leading-tight">{totalItems} item</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-base">{formatPrice(total)}</span>
                <ChevronRight size={16} className="text-white/70" />
              </div>
            </div>
          </button>
        </div>
      )}

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes stepperIn {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes cartSlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cartPop {
          0%,100% { transform: scale(1); }
          40%     { transform: scale(1.03); }
          70%     { transform: scale(0.98); }
        }
      `}</style>
    </div>
  )
}
