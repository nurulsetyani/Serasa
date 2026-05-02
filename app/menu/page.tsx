'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, X, Minus, Plus, ShoppingBag, Star, Clock, ChevronRight, Trash2, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MenuItem, Language } from '@/types'
import { supabase } from '@/lib/supabase'
import { MOCK_MENU, IS_MOCK_MODE } from '@/lib/mock-data'
import { useLang } from '@/context/LanguageContext'
import { useCart } from '@/context/CartContext'
import { getItemName, getItemDescription, TranslationKey } from '@/lib/i18n'
import { formatPrice, calculateCartTotal } from '@/lib/utils'
import LanguageModal from '@/components/LanguageModal'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!
const PRIMARY = '#FF6B35'

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

// ─── Toast ─────────────────────────────────────────────────
type Toast = { id: number; msg: string }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-2.5 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-xl"
          >
            <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Check size={11} strokeWidth={3} />
            </span>
            {toast.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Skeleton ──────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="h-40 bg-gray-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-100 rounded-full animate-pulse w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full animate-pulse w-full" />
        <div className="h-3 bg-gray-100 rounded-full animate-pulse w-1/2" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-5 bg-gray-100 rounded-full animate-pulse w-16" />
          <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// ─── Food Card ─────────────────────────────────────────────
function FoodCard({
  item, lang, tableNumber, onAdd, onDecrease, qty, idx,
}: {
  item: MenuItem; lang: Language; tableNumber: string
  onAdd: () => void; onDecrease: () => void; qty: number; idx: number
}) {
  const router = useRouter()
  const name = getItemName(item, lang)
  const desc = getItemDescription(item, lang)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer group"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
      onClick={() => router.push(`/menu/${item.id}?table=${tableNumber}`)}
    >
      {/* Image area */}
      <div className="relative h-40 bg-gray-100 overflow-hidden">
        <Image
          src={item.image || `https://placehold.co/400x300/FFF3EE/FF6B35?text=${encodeURIComponent(name)}`}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
        {/* gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Best seller */}
        {item.is_best_seller && (
          <div className="absolute top-2 left-2">
            <span className="flex items-center gap-0.5 text-[9px] font-black px-2 py-1 rounded-full text-white"
              style={{ background: PRIMARY }}>
              <Star size={8} fill="white" /> TERLARIS
            </span>
          </div>
        )}

        {/* Cook time */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white/90 text-[9px] px-1.5 py-0.5 rounded-full">
          <Clock size={8} /> {item.cook_time}m
        </div>

        {/* Floating add button */}
        <div className="absolute bottom-2 right-2" onClick={e => e.stopPropagation()}>
          <AnimatePresence mode="wait">
            {qty === 0 ? (
              <motion.button
                key="add"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                onClick={e => { e.stopPropagation(); onAdd() }}
                className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-xl shadow-lg"
                style={{ background: PRIMARY, boxShadow: `0 4px 12px rgba(255,107,53,0.45)` }}
              >
                +
              </motion.button>
            ) : (
              <motion.div
                key="stepper"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="flex items-center gap-1.5 bg-white rounded-full px-2 py-1 shadow-lg"
                onClick={e => e.stopPropagation()}
              >
                <motion.button whileTap={{ scale: 0.8 }} onClick={e => { e.stopPropagation(); onDecrease() }}
                  className="w-6 h-6 rounded-full flex items-center justify-center border border-gray-200 text-gray-600">
                  <Minus size={10} strokeWidth={2.5} />
                </motion.button>
                <span className="text-gray-900 font-bold text-xs w-4 text-center">{qty}</span>
                <motion.button whileTap={{ scale: 0.8 }} onClick={e => { e.stopPropagation(); onAdd() }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                  style={{ background: PRIMARY }}>
                  <Plus size={10} strokeWidth={2.5} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-[13px] leading-snug line-clamp-1">
          {name}
        </h3>
        {desc && (
          <p className="text-gray-400 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">{desc}</p>
        )}
        <p className="font-bold text-sm mt-2" style={{ color: PRIMARY }}>
          {formatPrice(item.price)}
        </p>
      </div>
    </motion.div>
  )
}

// ─── Cart Drawer ────────────────────────────────────────────
function CartDrawer({
  isOpen, onClose, tableNumber,
}: {
  isOpen: boolean; onClose: () => void; tableNumber: string
}) {
  const router = useRouter()
  const { lang, t } = useLang()
  const { items, addItem, updateQty, removeItem } = useCart()
  const total = calculateCartTotal(items)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  function handleCheckout() {
    onClose()
    setTimeout(() => router.push(`/checkout?table=${tableNumber}`), 200)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            drag="y" dragConstraints={{ top: 0 }} dragElastic={0.1}
            onDragEnd={(_, info) => { if (info.offset.y > 80) onClose() }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[88dvh] flex flex-col"
            style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Keranjang</h2>
                <p className="text-gray-400 text-xs">{items.reduce((s, i) => s + i.qty, 0)} item · Meja {tableNumber}</p>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <X size={15} />
              </button>
            </div>

            <div className="h-px bg-gray-100 mx-5" />

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <ShoppingBag size={40} className="text-gray-200 mb-3" />
                  <p className="text-gray-400 text-sm">{t('emptyCart')}</p>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map(item => {
                    const name = getItemName(item, lang)
                    return (
                      <motion.div key={item.id} layout
                        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3"
                      >
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={item.image || `https://placehold.co/80x80/FFF3EE/FF6B35?text=${encodeURIComponent(name[0])}`}
                            alt={name} fill className="object-cover" sizes="56px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium text-sm line-clamp-1">{name}</p>
                          <p className="font-bold text-sm mt-0.5" style={{ color: PRIMARY }}>
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <motion.button whileTap={{ scale: 0.8 }}
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500">
                            {item.qty === 1 ? <Trash2 size={11} className="text-red-400" /> : <Minus size={11} />}
                          </motion.button>
                          <span className="text-gray-900 font-bold text-sm w-5 text-center">{item.qty}</span>
                          <motion.button whileTap={{ scale: 0.8 }}
                            onClick={() => addItem(item)}
                            className="w-8 h-8 rounded-full text-white flex items-center justify-center"
                            style={{ background: PRIMARY }}>
                            <Plus size={11} />
                          </motion.button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-5 pt-4 pb-6 safe-bottom border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Total</span>
                  <span className="font-black text-xl text-gray-900">{formatPrice(total)}</span>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCheckout}
                  className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-between px-5"
                  style={{ background: PRIMARY, boxShadow: `0 8px 24px rgba(255,107,53,0.35)` }}>
                  <span>Konfirmasi Pesanan</span>
                  <div className="flex items-center gap-1">
                    <span>{formatPrice(total)}</span>
                    <ChevronRight size={18} />
                  </div>
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Main Page ─────────────────────────────────────────────
export default function MenuPage() {
  const router = useRouter()
  const { lang, t, isRTL } = useLang()
  const { items: cartItems, addItem, updateQty, totalItems } = useCart()

  const [tableNumber, setTableNumber]       = useState('1')
  const [menu, setMenu]                     = useState<MenuItem[]>([])
  const [loading, setLoading]               = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch]                 = useState('')
  const [showSearch, setShowSearch]         = useState(false)
  const [showLangModal, setShowLangModal]   = useState(false)
  const [cartOpen, setCartOpen]             = useState(false)
  const [toasts, setToasts]                 = useState<Toast[]>([])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
    const saved = localStorage.getItem('serasa_lang')
    if (!saved) setShowLangModal(true)
  }, [])

  const fetchMenu = useCallback(async () => {
    setLoading(true)
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 350))
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

  function showToast(msg: string) {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500)
  }

  function handleAdd(item: MenuItem) {
    addItem(item)
    showToast(`${getItemName(item, lang)} ditambahkan`)
  }

  function handleDecrease(item: MenuItem) {
    updateQty(item.id, (cartItems.find(i => i.id === item.id)?.qty ?? 1) - 1)
  }

  const filtered = menu.filter(item => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory
    return matchCat && (!search || getItemName(item, lang).toLowerCase().includes(search.toLowerCase()))
  })

  const hero = menu.find(i => i.is_best_seller) ?? menu[0]
  const total = calculateCartTotal(cartItems)

  return (
    <div className="min-h-dvh bg-[#FAFAFA]" dir={isRTL ? 'rtl' : 'ltr'}>
      {showLangModal && <LanguageModal onClose={() => setShowLangModal(false)} />}
      <ToastContainer toasts={toasts} />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-3 px-4 py-3">
          {!showSearch ? (
            <>
              <div className="relative h-8 w-[90px] flex-shrink-0">
                <Image src="/logo.png" alt="Serasa" fill className="object-contain object-left" sizes="90px" />
              </div>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                style={{ background: '#FFF3EE', borderColor: '#FFD5C4' }}>
                <span className="text-[10px] font-bold" style={{ color: PRIMARY }}>
                  Meja {tableNumber}
                </span>
              </div>
              <div className="flex-1" />
              <button onClick={() => setShowLangModal(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-base">
                {FLAG[lang]}
              </button>
              <button onClick={() => setShowSearch(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-400">
                <Search size={14} />
              </button>
            </>
          ) : (
            <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
              <Search size={14} className="text-gray-300 flex-shrink-0" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('search')}
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-300"
                autoFocus />
              <button onClick={() => { setShowSearch(false); setSearch('') }}>
                <X size={14} className="text-gray-300" />
              </button>
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <motion.button key={cat.key} whileTap={{ scale: 0.92 }}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                activeCategory === cat.key
                  ? 'text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
              style={activeCategory === cat.key ? { background: PRIMARY } : {}}>
              <span>{cat.icon}</span>
              <span>{t(cat.labelKey)}</span>
            </motion.button>
          ))}
        </div>
      </header>

      {/* ── HERO ── */}
      {hero && !search && activeCategory === 'all' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mx-4 mt-4 relative h-48 rounded-2xl overflow-hidden cursor-pointer"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
          onClick={() => router.push(`/menu/${hero.id}?table=${tableNumber}`)}>
          <Image
            src={hero.image || `https://placehold.co/800x450/FFF3EE/FF6B35?text=${encodeURIComponent(getItemName(hero, lang))}`}
            alt={getItemName(hero, lang)} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 p-5 flex flex-col justify-between">
            <span className="self-start text-white text-[9px] font-black px-3 py-1 rounded-full"
              style={{ background: PRIMARY }}>🔥 BEST SELLER</span>
            <div>
              <h2 className="text-white font-bold text-xl leading-tight">{getItemName(hero, lang)}</h2>
              <div className="flex items-center justify-between mt-2">
                <span className="text-white font-black text-lg">{formatPrice(hero.price)}</span>
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={e => { e.stopPropagation(); handleAdd(hero) }}
                  className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2 rounded-xl"
                  style={{ background: PRIMARY, boxShadow: '0 4px 12px rgba(255,107,53,0.4)' }}>
                  <Plus size={14} /> Tambah
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── GRID ── */}
      <main className="px-4 pt-5 pb-36">
        {!search && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">
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
              <FoodCard key={item.id} item={item} lang={lang} tableNumber={tableNumber}
                onAdd={() => handleAdd(item)} onDecrease={() => handleDecrease(item)}
                qty={cartItems.find(i => i.id === item.id)?.qty ?? 0} idx={idx} />
            ))}
          </div>
        )}
      </main>

      {/* ── FLOATING CART BAR ── */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-0 left-0 right-0 px-4 pb-5 safe-bottom z-40">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setCartOpen(true)}
              className="w-full rounded-2xl text-white overflow-hidden"
              style={{ background: PRIMARY, boxShadow: `0 8px 28px rgba(255,107,53,0.4)` }}>
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 w-9 h-9 rounded-xl flex items-center justify-center">
                    <ShoppingBag size={17} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white/70 text-[10px]">Keranjang</p>
                    <p className="text-white font-bold text-sm">{totalItems} item</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-black text-base">{formatPrice(total)}</span>
                  <ChevronRight size={18} className="text-white/70" />
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CART DRAWER ── */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} tableNumber={tableNumber} />
    </div>
  )
}
