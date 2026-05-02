'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Search, X, Clock, Minus, Plus, ShoppingBag,
  Star, ChevronRight, Trash2, UtensilsCrossed
} from 'lucide-react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
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

// ─── Skeleton ──────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-[#161616] rounded-2xl overflow-hidden border border-white/5">
      <div className="h-40 bg-white/5 animate-pulse" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-4 bg-white/5 rounded-full animate-pulse w-3/4" />
        <div className="h-3 bg-white/5 rounded-full animate-pulse" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-4 bg-white/5 rounded-full animate-pulse w-16" />
          <div className="w-9 h-9 bg-white/5 rounded-full animate-pulse" />
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
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.97 }}
      className="bg-[#161616] rounded-2xl overflow-hidden border border-white/[0.06] cursor-pointer group"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
      onClick={() => router.push(`/menu/${item.id}?table=${tableNumber}`)}
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-[#1E1E1E]">
        <Image
          src={item.image || `https://placehold.co/400x300/1a1a1a/D4AF37?text=${encodeURIComponent(name)}`}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
        {/* gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-transparent to-transparent opacity-80" />

        {/* Best seller badge */}
        {item.is_best_seller && (
          <div className="absolute top-2.5 left-2.5">
            <span className="flex items-center gap-1 bg-[#D4AF37] text-[#0A0A0A] text-[9px] font-black px-2 py-1 rounded-full">
              <Star size={8} fill="currentColor" /> TERLARIS
            </span>
          </div>
        )}

        {/* Cook time */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-white/70 text-[9px] bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
          <Clock size={8} /> {item.cook_time}m
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5">
        <h3 className="font-semibold text-white text-[13px] leading-snug line-clamp-1 group-hover:text-[#D4AF37] transition-colors duration-200">
          {name}
        </h3>
        {desc && (
          <p className="text-[#555] text-[11px] mt-1 line-clamp-2 leading-relaxed">{desc}</p>
        )}

        <div className="flex items-center justify-between mt-3.5" onClick={e => e.stopPropagation()}>
          <span className="text-[#D4AF37] font-black text-sm">{formatPrice(item.price)}</span>

          <AnimatePresence mode="wait">
            {qty === 0 ? (
              <motion.button
                key="add"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                whileTap={{ scale: 0.85 }}
                onClick={e => { e.stopPropagation(); onAdd() }}
                className="w-9 h-9 bg-[#D4AF37] hover:bg-[#E8CC5A] text-[#0A0A0A] rounded-full flex items-center justify-center font-black text-lg shadow-[0_4px_12px_rgba(212,175,55,0.4)]"
              >
                +
              </motion.button>
            ) : (
              <motion.div
                key="stepper"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="flex items-center gap-2"
                onClick={e => e.stopPropagation()}
              >
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={e => { e.stopPropagation(); onDecrease() }}
                  className="w-8 h-8 border border-[#D4AF37]/40 text-[#D4AF37] rounded-full flex items-center justify-center hover:bg-[#D4AF37]/10 transition-colors"
                >
                  <Minus size={12} strokeWidth={2.5} />
                </motion.button>
                <span className="text-white font-bold text-sm w-4 text-center">{qty}</span>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={e => { e.stopPropagation(); onAdd() }}
                  className="w-8 h-8 bg-[#D4AF37] text-[#0A0A0A] rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(212,175,55,0.3)]"
                >
                  <Plus size={12} strokeWidth={2.5} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Cart Bottom Sheet ─────────────────────────────────────
function CartSheet({
  isOpen, onClose, tableNumber,
}: {
  isOpen: boolean; onClose: () => void; tableNumber: string
}) {
  const router = useRouter()
  const { lang, t } = useLang()
  const { items, addItem, updateQty, removeItem, clearCart } = useCart()
  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, 300], [1, 0])
  const total = calculateCartTotal(items)

  // Lock body scroll when open
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => { if (info.offset.y > 80) onClose() }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111] rounded-t-[28px] max-h-[85dvh] flex flex-col"
            style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.6)', y }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 flex-shrink-0">
              <div>
                <h2 className="text-white font-bold text-lg">Keranjang</h2>
                <p className="text-[#555] text-xs">{items.reduce((s, i) => s + i.qty, 0)} item · Meja {tableNumber}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-[#888] hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5 mx-5 flex-shrink-0" />

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShoppingBag size={40} className="text-white/10 mb-3" />
                  <p className="text-[#444] text-sm">{t('emptyCart')}</p>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map(item => {
                    const name = getItemName(item, lang)
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3"
                      >
                        {/* Thumb */}
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#1E1E1E] flex-shrink-0">
                          <Image
                            src={item.image || `https://placehold.co/80x80/1a1a1a/D4AF37?text=${encodeURIComponent(name[0])}`}
                            alt={name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-[13px] line-clamp-1">{name}</p>
                          <p className="text-[#D4AF37] font-bold text-sm mt-0.5">{formatPrice(item.price)}</p>
                          {item.itemNotes && (
                            <p className="text-[#444] text-[10px] italic mt-0.5">📝 {item.itemNotes}</p>
                          )}
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            className="w-8 h-8 rounded-full border border-white/12 text-white flex items-center justify-center hover:border-red-500/40 hover:text-red-400 transition-colors"
                          >
                            {item.qty === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
                          </motion.button>
                          <span className="text-white font-bold text-sm w-5 text-center">{item.qty}</span>
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => addItem(item)}
                            className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#0A0A0A] flex items-center justify-center shadow-[0_2px_8px_rgba(212,175,55,0.3)]"
                          >
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
              <div className="px-5 pt-4 pb-6 safe-bottom border-t border-white/5 flex-shrink-0 space-y-3">
                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-[#888] text-sm">Total Pesanan</span>
                  <span className="text-[#D4AF37] font-black text-xl">{formatPrice(total)}</span>
                </div>

                {/* Checkout button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCheckout}
                  className="w-full py-4 rounded-2xl font-black text-[#0A0A0A] text-base flex items-center justify-between px-5"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37 0%, #E8CC5A 50%, #C4960C 100%)',
                    boxShadow: '0 8px 32px rgba(212,175,55,0.4)',
                  }}
                >
                  <span>Lanjut Pesan</span>
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
  const [cartPop, setCartPop]               = useState(false)

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
    setCartPop(true)
    setTimeout(() => setCartPop(false), 400)
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
    <div className="min-h-dvh bg-[#0A0A0A]" dir={isRTL ? 'rtl' : 'ltr'}>
      {showLangModal && <LanguageModal onClose={() => setShowLangModal(false)} />}

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)' }} />
      </div>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-3">
          {!showSearch ? (
            <>
              <div className="relative h-8 w-[90px] flex-shrink-0">
                <Image src="/logo.png" alt="Serasa" fill className="object-contain object-left" sizes="90px" />
              </div>

              <div className="h-4 w-px bg-white/10" />

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                <UtensilsCrossed size={10} className="text-[#D4AF37]" />
                <span className="text-[#D4AF37] text-[10px] font-bold">{t('table')} {tableNumber}</span>
              </div>

              <div className="flex-1" />

              <button
                onClick={() => setShowLangModal(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/8 text-base hover:bg-white/10 transition-all"
              >
                {FLAG[lang]}
              </button>
              <button
                onClick={() => setShowSearch(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/8 text-[#666] hover:text-white transition-all"
              >
                <Search size={14} />
              </button>
            </>
          ) : (
            <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2.5 border border-white/10">
              <Search size={13} className="text-[#555] flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('search')}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#444]"
                autoFocus
              />
              <button onClick={() => { setShowSearch(false); setSearch('') }}
                className="text-[#555] hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <motion.button
              key={cat.key}
              whileTap={{ scale: 0.92 }}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                activeCategory === cat.key
                  ? 'bg-[#D4AF37] text-[#0A0A0A] shadow-[0_2px_12px_rgba(212,175,55,0.4)]'
                  : 'bg-white/5 text-[#666] border border-white/8 hover:border-[#D4AF37]/30 hover:text-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{t(cat.labelKey)}</span>
            </motion.button>
          ))}
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      {hero && !search && activeCategory === 'all' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-4 mt-4 relative h-52 rounded-3xl overflow-hidden cursor-pointer"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
          onClick={() => router.push(`/menu/${hero.id}?table=${tableNumber}`)}
        >
          <Image
            src={hero.image || `https://placehold.co/800x450/1a1a1a/D4AF37?text=${encodeURIComponent(getItemName(hero, lang))}`}
            alt={getItemName(hero, lang)}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute inset-0 p-5 flex flex-col justify-between">
            <span className="self-start bg-[#D4AF37] text-[#0A0A0A] text-[9px] font-black px-3 py-1 rounded-full">
              🔥 BEST SELLER
            </span>
            <div>
              <p className="text-[#D4AF37]/70 text-[9px] tracking-[3px] uppercase mb-1">Featured</p>
              <h2 className="text-white font-bold text-2xl leading-tight">{getItemName(hero, lang)}</h2>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[#D4AF37] font-black text-xl">{formatPrice(hero.price)}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={e => { e.stopPropagation(); handleAdd(hero) }}
                  className="flex items-center gap-2 bg-[#D4AF37] text-[#0A0A0A] font-bold text-sm px-4 py-2.5 rounded-xl"
                  style={{ boxShadow: '0 4px 16px rgba(212,175,55,0.4)' }}
                >
                  <Plus size={14} /> Tambah
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── MENU GRID ── */}
      <main className="px-4 pt-5 pb-36">
        {!search && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">
              {activeCategory === 'all'
                ? (lang === 'ar' ? 'القائمة الكاملة' : lang === 'id' ? 'Semua Menu' : 'Full Menu')
                : t(CATEGORIES.find(c => c.key === activeCategory)?.labelKey ?? 'all')}
            </h2>
            <span className="text-[#444] text-xs">{filtered.length} item</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">🍽️</span>
            <p className="text-[#444] text-sm">{t('noItems')}</p>
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

      {/* ── FLOATING CART BAR ── */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-0 left-0 right-0 px-4 pb-5 safe-bottom z-40"
          >
            <motion.button
              animate={cartPop ? { scale: [1, 1.04, 0.97, 1] } : {}}
              transition={{ duration: 0.35 }}
              onClick={() => setCartOpen(true)}
              className="w-full rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #E8CC5A 50%, #C4960C 100%)',
                boxShadow: '0 8px 32px rgba(212,175,55,0.45), 0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#0A0A0A]/20 rounded-xl w-9 h-9 flex items-center justify-center">
                    <span className="text-[#0A0A0A] font-black text-sm">{totalItems}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-[#0A0A0A]/60 text-[10px] leading-none font-medium">Keranjang</p>
                    <p className="text-[#0A0A0A] font-bold text-sm leading-tight">Lihat Pesanan</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#0A0A0A] font-black text-base">{formatPrice(total)}</span>
                  <ChevronRight size={18} className="text-[#0A0A0A]/70" />
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CART BOTTOM SHEET ── */}
      <CartSheet
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        tableNumber={tableNumber}
      />
    </div>
  )
}
