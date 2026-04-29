'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Search, X, ChevronDown } from 'lucide-react'
import { MenuItem } from '@/types'
import { supabase } from '@/lib/supabase'
import { MOCK_MENU, IS_MOCK_MODE } from '@/lib/mock-data'
import { useLang } from '@/context/LanguageContext'
import { useCart } from '@/context/CartContext'
import { getItemName } from '@/lib/i18n'
import { formatPrice, calculateCartTotal, getTimeBasedPromo } from '@/lib/utils'
import MenuCard from '@/components/MenuCard'
import LanguageToggle from '@/components/LanguageToggle'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

const CATEGORIES = [
  { key: 'all',    labelKey: 'all' as const,     icon: '🍽️' },
  { key: 'noodles', labelKey: 'noodles' as const, icon: '🍜' },
  { key: 'rice',   labelKey: 'rice' as const,     icon: '🍚' },
  { key: 'main',   labelKey: 'main' as const,     icon: '🥘' },
  { key: 'drinks', labelKey: 'drinks' as const,   icon: '🥤' },
  { key: 'snacks', labelKey: 'snacks' as const,   icon: '🥙' },
]

export default function MenuPage() {
  const router = useRouter()
  const [tableNumber, setTableNumber] = useState('1')

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
  }, [])
  const { lang, t, isRTL } = useLang()
  const { items: cartItems, addItem, setPromo, totalItems } = useCart()

  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [upsellItem, setUpsellItem] = useState<MenuItem | null>(null)
  const [drinkOptions, setDrinkOptions] = useState<MenuItem[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

  // Apply time-based promo
  useEffect(() => {
    setPromo(getTimeBasedPromo())
  }, [setPromo])

  // Fetch menu (mock or Supabase)
  useEffect(() => {
    async function fetchMenu() {
      setLoading(true)

      if (IS_MOCK_MODE) {
        setMenu(MOCK_MENU)
        setDrinkOptions(MOCK_MENU.filter(i => i.category === 'drinks'))
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('menu')
        .select('*')
        .eq('restaurant_id', RESTAURANT_ID)
        .eq('is_available', true)
        .order('is_best_seller', { ascending: false })

      if (!error && data) {
        setMenu(data as MenuItem[])
        setDrinkOptions((data as MenuItem[]).filter(i => i.category === 'drinks'))
      }
      setLoading(false)
    }
    fetchMenu()
  }, [])

  // Filtered menu
  const filtered = menu.filter(item => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory
    const name = getItemName(item, lang).toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  // Best sellers from filtered
  const bestSellers = filtered.filter(i => i.is_best_seller)
  const others = filtered.filter(i => !i.is_best_seller)
  const orderedFiltered = [...bestSellers, ...others]

  const { total } = calculateCartTotal(cartItems)

  function handleAddWithUpsell(item: MenuItem) {
    addItem(item)
    if (item.category !== 'drinks' && drinkOptions.length > 0) {
      const hasNoDrinks = !cartItems.some(i => i.category === 'drinks')
      if (hasNoDrinks) setUpsellItem(item)
    }
  }

  function closeUpsell() { setUpsellItem(null) }
  function addDrinkAndClose(drink: MenuItem) {
    addItem(drink)
    setUpsellItem(null)
  }

  return (
    <div className="min-h-dvh bg-obsidian flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gold/3 rounded-full blur-[80px]" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-obsidian/90 backdrop-blur-xl border-b border-gold-border safe-top">
        <div className="px-4 py-3">
          {showSearch ? (
            <div className="flex items-center gap-2 animate-fade-in">
              <Search size={16} className="text-ink-muted flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('search')}
                className="flex-1 bg-transparent text-ink text-sm outline-none placeholder:text-ink-muted"
                autoFocus
              />
              <button onClick={() => { setShowSearch(false); setSearch('') }} className="text-ink-muted hover:text-ink">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold-border flex items-center justify-center">
                  <span className="text-gold text-sm">🌿</span>
                </div>
                <div>
                  <h1 className="font-display text-ink font-bold text-lg leading-none tracking-tight">SERASA</h1>
                  <p className="text-ink-muted text-[10px] leading-none">
                    {t('table')} {tableNumber}
                  </p>
                </div>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2">
                <LanguageToggle />
                <button
                  onClick={() => { setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 50) }}
                  className="p-2 text-ink-muted hover:text-gold transition-colors"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                activeCategory === cat.key
                  ? 'bg-gold text-obsidian shadow-gold-sm'
                  : 'bg-obsidian-light text-ink-muted border border-gold-border hover:border-gold/40 hover:text-ink'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{t(cat.labelKey)}</span>
            </button>
          ))}
        </div>
      </header>

      {/* MENU GRID */}
      <main className="flex-1 px-4 py-4 pb-32">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton rounded-2xl h-56" />
            ))}
          </div>
        ) : orderedFiltered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🍽️</span>
            <p className="text-ink-muted">{t('noItems')}</p>
          </div>
        ) : (
          <>
            {/* Best sellers section label (only on 'all' tab) */}
            {activeCategory === 'all' && bestSellers.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gold text-sm font-bold">⭐ {t('bestSeller')}</span>
                <div className="flex-1 h-px bg-gold-border" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {orderedFiltered.map((item, idx) => (
                <div
                  key={item.id}
                  style={{ animationDelay: `${idx * 50}ms`, opacity: 0 }}
                  className="animate-fade-up"
                >
                  <MenuCard item={item} onAddWithUpsell={handleAddWithUpsell} />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* STICKY CART BAR */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom z-40">
          <button
            onClick={() => router.push(`/cart?table=${tableNumber}`)}
            className="btn-gold w-full py-4 flex items-center justify-between px-5 rounded-2xl"
          >
            <div className="flex items-center gap-2">
              <div className="bg-obsidian/25 rounded-full w-7 h-7 flex items-center justify-center">
                <span className="text-obsidian font-bold text-xs">{totalItems}</span>
              </div>
              <span className="font-semibold text-sm">{t('cart')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold">{formatPrice(total)}</span>
              <ChevronDown size={16} className={`${isRTL ? 'rotate-90' : '-rotate-90'}`} />
            </div>
          </button>
        </div>
      )}

      {/* UPSELL MODAL */}
      {upsellItem && drinkOptions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeUpsell} />
          <div className="relative w-full max-w-sm bg-obsidian-light border border-gold-border rounded-2xl p-5 animate-slide-up">
            <h3 className="font-display text-lg font-bold text-ink mb-1">{t('addDrink')}</h3>
            <p className="text-ink-muted text-sm mb-4">{t('addDrinkSub')}</p>
            <div className="flex flex-col gap-2 mb-4">
              {drinkOptions.slice(0, 3).map(drink => (
                <button
                  key={drink.id}
                  onClick={() => addDrinkAndClose(drink)}
                  className="flex items-center justify-between p-3 rounded-xl bg-obsidian-surface border border-gold-border hover:border-gold/40 transition-colors"
                >
                  <span className="text-ink text-sm">{getItemName(drink, lang)}</span>
                  <span className="text-gold font-bold text-sm">{formatPrice(drink.price)}</span>
                </button>
              ))}
            </div>
            <button onClick={closeUpsell} className="btn-ghost w-full py-2.5 text-sm">
              {t('noThanks')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
