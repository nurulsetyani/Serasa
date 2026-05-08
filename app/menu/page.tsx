'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Search, X, Clock, Minus, Plus, ShoppingBag,
  Star, ChevronRight, Trash2, Utensils, Check,
} from 'lucide-react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { MenuItem, Language } from '@/types'
import { supabase } from '@/lib/supabase'
import { MOCK_MENU, IS_MOCK_MODE } from '@/lib/mock-data'
import { useLang } from '@/context/LanguageContext'
import { useCart } from '@/context/CartContext'
import { getItemName, getItemDescription, TranslationKey } from '@/lib/i18n'
import { formatPrice, calculateCartTotal, discountedPrice } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────
const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!
const PRIMARY  = '#FF6B35'
const GOLD     = '#D4AF37'

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

// ─── Toast ────────────────────────────────────────────────
type Toast = { id: number; name: string }

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            className="flex items-center gap-2.5 bg-gray-900 text-white text-[13px] font-medium px-4 py-3 rounded-2xl shadow-xl"
          >
            <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Check size={11} strokeWidth={3} />
            </span>
            <span className="line-clamp-1">✓ {toast.name}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-100 rounded-full animate-pulse w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full animate-pulse" />
        <div className="h-3 bg-gray-100 rounded-full animate-pulse w-1/2" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-4 bg-gray-100 rounded-full animate-pulse w-16" />
          <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// ─── Food Card ────────────────────────────────────────────
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
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: idx * 0.045, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer"
      style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.07)', border: '1px solid #F5F0EC' }}
      onClick={() => router.push(`/menu/${item.id}?table=${tableNumber}`)}
    >
      {/* Image zone */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        <Image
          src={item.image || `/hero-food.png`}
          alt={name} fill
          className="object-cover transition-transform duration-500 hover:scale-105"
          sizes="(max-width: 768px) 50vw, 33vw"
        />

        {/* Light warm overlay */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(255,245,235,0.35) 0%, transparent 50%)' }} />

        {/* Best seller badge */}
        {item.is_best_seller && (
          <div className="absolute top-2 left-2">
            <span className="flex items-center gap-0.5 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-md"
              style={{ background: PRIMARY }}>
              <Star size={8} fill="white" /> TERLARIS
            </span>
          </div>
        )}

        {/* Cook time */}
        <div className="absolute bottom-2 left-2 flex items-center gap-0.5 text-[9px] font-medium px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-sm"
          style={{ color: '#8A7A70', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <Clock size={8} /> {item.cook_time}m
        </div>

        {/* Add / Stepper button — floating on image */}
        <div className="absolute bottom-2 right-2" onClick={e => e.stopPropagation()}>
          <AnimatePresence mode="wait">
            {qty === 0 ? (
              <motion.button key="add"
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                whileTap={{ scale: 0.82 }}
                onClick={e => { e.stopPropagation(); onAdd() }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg"
                style={{ background: PRIMARY, boxShadow: `0 4px 14px rgba(255,107,53,0.45)` }}>
                +
              </motion.button>
            ) : (
              <motion.div key="stepper"
                initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="flex items-center gap-1 bg-white rounded-full shadow-lg px-1.5 py-1"
                style={{ border: '1px solid #F0EDE8' }}
                onClick={e => e.stopPropagation()}>
                <motion.button whileTap={{ scale: 0.78 }} onClick={e => { e.stopPropagation(); onDecrease() }}
                  className="w-6 h-6 rounded-full flex items-center justify-center border border-gray-200 bg-gray-50 text-gray-600">
                  <Minus size={10} strokeWidth={2.5} />
                </motion.button>
                <span className="text-gray-900 font-black text-xs w-5 text-center">{qty}</span>
                <motion.button whileTap={{ scale: 0.78 }} onClick={e => { e.stopPropagation(); onAdd() }}
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
        <h3 className="font-bold text-gray-900 text-[13px] leading-snug line-clamp-1 mb-0.5">{name}</h3>
        {desc && <p className="text-gray-400 text-[11px] line-clamp-2 leading-relaxed mb-2">{desc}</p>}
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-black text-sm" style={{ color: PRIMARY }}>
            {formatPrice(discountedPrice(item.price, item.discount_percent))}
          </p>
          {(item.discount_percent ?? 0) > 0 && (
            <>
              <span className="text-[10px] text-gray-400 line-through">{formatPrice(item.price)}</span>
              <span className="text-[9px] font-black text-white px-1.5 py-0.5 rounded-full bg-red-500">
                -{item.discount_percent}%
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Hero Card ────────────────────────────────────────────
function HeroCard({
  item, lang, tableNumber, onAdd, qty,
}: {
  item: MenuItem; lang: Language; tableNumber: string; onAdd: () => void; qty: number
}) {
  const router = useRouter()
  const name = getItemName(item, lang)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mx-4 mt-4 rounded-3xl overflow-hidden cursor-pointer relative"
      style={{ boxShadow: '0 6px 32px rgba(0,0,0,0.12)', border: '1px solid #F0EDE8' }}
      onClick={() => router.push(`/menu/${item.id}?table=${tableNumber}`)}
    >
      {/* Image */}
      <div className="relative h-52 bg-amber-50">
        <Image
          src={item.image || '/hero-food.png'}
          alt={name} fill priority
          className="object-cover"
          sizes="100vw"
        />
        {/* Very light warm gradient - not dark */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(255,250,245,0.6) 0%, rgba(255,250,245,0.1) 50%, transparent 100%)' }} />
      </div>

      {/* Content overlay — left side */}
      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        {/* Badge */}
        <div>
          <span className="inline-flex items-center gap-1 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-md"
            style={{ background: PRIMARY }}>
            🔥 {lang === 'ar' ? 'الأكثر مبيعاً' : lang === 'id' ? 'TERLARIS' : 'BEST SELLER'}
          </span>
        </div>

        {/* Info at bottom */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-900 text-base leading-tight line-clamp-1">{name}</p>
            <p className="font-bold text-sm mt-0.5" style={{ color: PRIMARY }}>{formatPrice(item.price)}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={e => { e.stopPropagation(); onAdd() }}
            className="flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2.5 rounded-xl flex-shrink-0"
            style={{ background: PRIMARY, boxShadow: `0 4px 14px rgba(255,107,53,0.4)` }}>
            <Plus size={14} />
            {qty > 0 ? `+${qty}` : 'Tambah'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Cart Bottom Sheet ────────────────────────────────────
function CartSheet({
  isOpen, onClose, tableNumber,
}: {
  isOpen: boolean; onClose: () => void; tableNumber: string
}) {
  const router = useRouter()
  const { lang, t } = useLang()
  const { items, addItem, updateQty } = useCart()
  const y = useMotionValue(0)
  const total = calculateCartTotal(items)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            drag="y" dragConstraints={{ top: 0 }} dragElastic={0.1}
            onDragEnd={(_, info) => { if (info.offset.y > 80) onClose() }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] max-h-[88dvh] flex flex-col"
            style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.1)', y }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3.5 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
              <div>
                <h2 className="font-black text-gray-900 text-lg">{t('yourCart')}</h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  {items.reduce((s, i) => s + i.qty, 0)} {t('items')} · {t('table')} {tableNumber}
                </p>
              </div>
              <button onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <X size={16} />
              </button>
            </div>

            <div className="h-px bg-gray-100 mx-5 flex-shrink-0" />

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
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
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="flex items-center gap-3"
                      >
                        {/* Thumb */}
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-amber-50 flex-shrink-0"
                          style={{ border: '1px solid #F5EDE8' }}>
                          <Image
                            src={item.image || '/hero-food.png'}
                            alt={name} fill className="object-cover" sizes="64px"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-bold text-sm line-clamp-1">{name}</p>
                          <p className="font-black text-sm mt-0.5" style={{ color: PRIMARY }}>
                            {formatPrice(item.price)}
                          </p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <motion.button whileTap={{ scale: 0.8 }}
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">
                            {item.qty === 1
                              ? <Trash2 size={11} className="text-red-400" />
                              : <Minus size={11} className="text-gray-500" />}
                          </motion.button>
                          <span className="font-black text-gray-900 text-sm w-5 text-center">{item.qty}</span>
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
              <div className="px-5 pb-6 safe-bottom border-t border-gray-100 pt-4 flex-shrink-0 space-y-3">
                {/* Summary */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm font-medium">{t('total')}</span>
                  <span className="font-black text-xl text-gray-900">{formatPrice(total)}</span>
                </div>

                {/* Checkout CTA */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onClose(); setTimeout(() => router.push(`/checkout?table=${tableNumber}`), 200) }}
                  className="w-full py-4 rounded-full text-white font-black text-base flex items-center justify-between px-5"
                  style={{
                    background: `linear-gradient(135deg, ${PRIMARY} 0%, #FF8C5A 100%)`,
                    boxShadow: `0 8px 28px rgba(255,107,53,0.38)`,
                  }}>
                  <span>{t('checkout')}</span>
                  <div className="flex items-center gap-1 bg-white/20 rounded-xl px-3 py-1.5">
                    <span className="text-sm font-bold">{formatPrice(total)}</span>
                    <ChevronRight size={14} />
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

// ─── Floating Cart Bar ────────────────────────────────────
function FloatingCartBar({ totalItems, total, onOpen, cartPop }: {
  totalItems: number; total: number; onOpen: () => void; cartPop: boolean
}) {
  const { t } = useLang()
  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-0 left-0 right-0 px-4 pb-5 safe-bottom z-40"
        >
          <motion.button
            animate={cartPop ? { scale: [1, 1.04, 0.97, 1] } : {}}
            transition={{ duration: 0.35 }}
            onClick={onOpen}
            className="w-full relative overflow-hidden rounded-full"
            style={{
              background: `linear-gradient(135deg, ${PRIMARY} 0%, #FF8C5A 60%, ${GOLD} 100%)`,
              boxShadow: `0 8px 32px rgba(255,107,53,0.42), 0 2px 8px rgba(0,0,0,0.12)`,
            }}
          >
            {/* shimmer */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.15) 50%, transparent 65%)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 0.8 }}
            />

            <div className="relative flex items-center justify-between px-5 py-4">
              {/* Left — item count */}
              <div className="flex items-center gap-3">
                <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center">
                  <ShoppingBag size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white/75 text-[10px] font-medium">{t('cart')}</p>
                  <p className="text-white font-black text-sm leading-tight">{totalItems} {t('items')}</p>
                </div>
              </div>

              {/* Right — price + arrow */}
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-base">{formatPrice(total)}</span>
                <div className="bg-white/20 w-7 h-7 rounded-lg flex items-center justify-center">
                  <ChevronRight size={15} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Menu Page ────────────────────────────────────────────
export default function MenuPage() {
  const router = useRouter()
  const { lang, t, isRTL } = useLang()
  const { items: cartItems, addItem, updateQty, totalItems } = useCart()

  const [tableNumber, setTableNumber]         = useState('1')
  const [menu, setMenu]                       = useState<MenuItem[]>([])
  const [loading, setLoading]                 = useState(true)
  const [activeCategory, setActiveCategory]   = useState('all')
  const [search, setSearch]                   = useState('')
  const [showSearch, setShowSearch]           = useState(false)
  const [cartOpen, setCartOpen]               = useState(false)
  const [cartPop, setCartPop]                 = useState(false)
  const [toasts, setToasts]                   = useState<Toast[]>([])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
  }, [])

  const fetchMenu = useCallback(async () => {
    setLoading(true)
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 350))
      setMenu(MOCK_MENU); setLoading(false); return
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

  function showToast(name: string) {
    const id = Date.now()
    setToasts(prev => [...prev, { id, name }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2200)
  }

  function handleAdd(item: MenuItem) {
    addItem(item)
    showToast(getItemName(item, lang))
    setCartPop(true)
    setTimeout(() => setCartPop(false), 400)
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
      <ToastStack toasts={toasts} />

      {/* ═══════ HEADER ════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white"
        style={{ boxShadow: '0 1px 16px rgba(0,0,0,0.07)' }}>

        <div className="flex items-center gap-2 px-4 py-3">
          {!showSearch ? (
            <>
              {/* Logo */}
              <div className="relative h-8 w-[80px] flex-shrink-0">
                <Image src="/logo.png" alt="Serasa" fill className="object-contain object-left" sizes="80px" priority />
              </div>

              {/* Table number — next to logo, #FF6B35 */}
              <div className="flex items-center px-2.5 py-1.5 rounded-full flex-shrink-0"
                style={{ background: `${PRIMARY}15`, border: `1px solid ${PRIMARY}30` }}>
                <span className="text-[11px] font-black" style={{ color: PRIMARY }}>
                  #{tableNumber}
                </span>
              </div>

              <div className="flex-1" />

              {/* 3 Language flags */}
              <div className="flex gap-1 flex-shrink-0">
                {(['en','id','ar'] as Language[]).map(l => (
                  <button key={l} onClick={() => {
                    try { localStorage.setItem('serasa_lang', l) } catch {}
                    window.location.reload()
                  }}
                    className="text-base leading-none w-7 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: lang === l ? `${PRIMARY}20` : 'transparent',
                      border: lang === l ? `1.5px solid ${PRIMARY}` : '1.5px solid transparent',
                      fontSize: 16,
                    }}>
                    {l === 'id' ? '🇮🇩' : l === 'en' ? '🇬🇧' : '🇸🇦'}
                  </button>
                ))}
              </div>

              {/* Search button */}
              <button onClick={() => setShowSearch(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-400 flex-shrink-0">
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0"
              style={activeCategory === cat.key
                ? { background: PRIMARY, color: '#FFFFFF', border: `1.5px solid ${PRIMARY}`, boxShadow: `0 2px 10px rgba(255,107,53,0.35)` }
                : { background: '#FFFFFF', color: '#9CA3AF', border: '1.5px solid #F0ECE8' }}>
              <span>{cat.icon}</span>
              <span>{t(cat.labelKey)}</span>
            </motion.button>
          ))}
        </div>
      </header>

      {/* ═══════ HERO ══════════════════════════════════════ */}
      {hero && !search && activeCategory === 'all' && (
        <HeroCard item={hero} lang={lang} tableNumber={tableNumber}
          onAdd={() => handleAdd(hero)}
          qty={cartItems.find(i => i.id === hero.id)?.qty ?? 0} />
      )}

      {/* ═══════ GRID LABEL ════════════════════════════════ */}
      <div className="flex items-center justify-between px-4 mt-5 mb-3">
        <h2 className="font-black text-gray-900 text-sm">
          {activeCategory === 'all' ? t('fullMenu')
            : t(CATEGORIES.find(c => c.key === activeCategory)?.labelKey ?? 'all')}
        </h2>
        {!search && (
          <span className="text-gray-400 text-xs">{filtered.length} {t('items')}</span>
        )}
      </div>

      {/* ═══════ FOOD GRID ═════════════════════════════════ */}
      <main className="px-4 pb-36">
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
              <FoodCard key={item.id} item={item} lang={lang}
                tableNumber={tableNumber}
                onAdd={() => handleAdd(item)}
                onDecrease={() => handleDecrease(item)}
                qty={cartItems.find(i => i.id === item.id)?.qty ?? 0}
                idx={idx} />
            ))}
          </div>
        )}
      </main>

      {/* ═══════ FLOATING CART BAR ═════════════════════════ */}
      <FloatingCartBar
        totalItems={totalItems} total={total}
        onOpen={() => setCartOpen(true)} cartPop={cartPop}
      />

      {/* ═══════ CART BOTTOM SHEET ═════════════════════════ */}
      <CartSheet
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        tableNumber={tableNumber}
      />
    </div>
  )
}
