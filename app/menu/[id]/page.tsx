'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Clock, Star, Minus, Plus, ShoppingBag, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MenuItem } from '@/types'
import { supabase } from '@/lib/supabase'
import { MOCK_MENU, IS_MOCK_MODE } from '@/lib/mock-data'
import { useLang } from '@/context/LanguageContext'
import { useCart } from '@/context/CartContext'
import { getItemName, getItemDescription } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'

const PRIMARY = '#FF6B35'

export default function MenuDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { lang, t, isRTL } = useLang()
  const { items: cartItems, addItem, updateQty } = useCart()

  const [item, setItem]         = useState<MenuItem | null>(null)
  const [loading, setLoading]   = useState(true)
  const [tableNumber, setTable] = useState('1')
  const [imgError, setImgError] = useState(false)
  const [added, setAdded]       = useState(false)
  const [itemNotes, setNotes]   = useState('')

  const cartItem = item ? cartItems.find(i => i.id === item.id) : null
  const qty = cartItem?.qty ?? 0

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTable(p.get('table') ?? '1')
  }, [])

  useEffect(() => {
    async function fetchItem() {
      setLoading(true)
      if (IS_MOCK_MODE) {
        setItem(MOCK_MENU.find(m => m.id === id) ?? null)
        setLoading(false)
        return
      }
      const { data } = await supabase.from('menu').select('*').eq('id', id).single()
      setItem(data as MenuItem ?? null)
      setLoading(false)
    }
    fetchItem()
  }, [id])

  function handleAdd() {
    if (!item) return
    addItem(item, itemNotes.trim() || undefined)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-dvh bg-[#FAFAFA] flex flex-col">
        {/* skeleton header image */}
        <div className="h-72 bg-gray-200 animate-pulse" />
        <div className="bg-white rounded-t-3xl -mt-6 px-5 pt-6 space-y-4">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
          <div className="h-7 bg-gray-100 rounded-xl animate-pulse w-3/4" />
          <div className="h-4 bg-gray-100 rounded-full animate-pulse w-1/3" />
          <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────
  if (!item) {
    return (
      <div className="min-h-dvh bg-[#FAFAFA] flex flex-col items-center justify-center p-8 text-center">
        <span className="text-5xl mb-4">🍽️</span>
        <p className="text-gray-400 text-sm mb-6">Menu tidak ditemukan</p>
        <button onClick={() => router.back()}
          className="px-6 py-3 rounded-2xl text-white font-bold text-sm"
          style={{ background: PRIMARY }}>
          Kembali
        </button>
      </div>
    )
  }

  const name = getItemName(item, lang)
  const desc = getItemDescription(item, lang)
  const notesPlaceholder: Record<string, string> = {
    id: 'cth: tanpa bawang, tidak pedas...',
    en: 'e.g. no onions, less spicy...',
    ar: 'مثال: بدون بصل، قليل الحرارة...',
  }

  return (
    <div className="min-h-dvh bg-[#FAFAFA]" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── HERO IMAGE ── */}
      <div className="relative h-72 bg-gray-100 overflow-hidden">
        {!imgError ? (
          <Image
            src={item.image || `https://placehold.co/800x600/FFF3EE/FF6B35?text=${encodeURIComponent(name)}`}
            alt={name} fill className="object-cover" priority sizes="100vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-orange-50 flex items-center justify-center text-6xl">🍽️</div>
        )}

        {/* gradient bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Back button */}
        <div className="absolute top-4 left-4 safe-top">
          <button onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
            <ArrowLeft size={18} className={`text-gray-700 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Best seller badge */}
        {item.is_best_seller && (
          <div className="absolute top-4 right-4">
            <span className="flex items-center gap-1 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-md"
              style={{ background: PRIMARY }}>
              <Star size={9} fill="white" /> TERLARIS
            </span>
          </div>
        )}
      </div>

      {/* ── CONTENT PANEL ── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative -mt-6 bg-white rounded-t-3xl px-5 pt-5 pb-40"
        style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.06)' }}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        {/* Name + Price */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1 className="font-bold text-gray-900 text-2xl leading-tight flex-1">{name}</h1>
          <span className="font-black text-2xl flex-shrink-0" style={{ color: PRIMARY }}>
            {formatPrice(item.price)}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12}
                className={i < 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'} />
            ))}
            <span className="text-gray-400 text-xs ml-1">4.8</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Clock size={12} />
            <span>{item.cook_time} {t('minutes')}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mb-5" />

        {/* Description */}
        {desc && (
          <div className="mb-5">
            <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
          </div>
        )}

        {/* Badges */}
        <div className="flex gap-2 flex-wrap mb-6">
          {['Halal ✓', 'No MSG', 'Fresh Daily'].map(b => (
            <span key={b} className="text-[11px] font-medium px-3 py-1.5 rounded-full border"
              style={{ background: '#FFF3EE', borderColor: '#FFD5C4', color: PRIMARY }}>
              {b}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mb-5" />

        {/* Notes */}
        <div className="mb-4">
          <p className="text-gray-700 font-semibold text-sm mb-2.5">{t('notesOptional')}</p>
          <textarea
            value={itemNotes}
            onChange={e => setNotes(e.target.value)}
            placeholder={notesPlaceholder[lang] ?? notesPlaceholder.en}
            rows={3}
            dir={isRTL ? 'rtl' : 'ltr'}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none resize-none transition-colors"
            style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)' }}
            onFocus={e => e.currentTarget.style.borderColor = PRIMARY}
            onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
          />
        </div>
      </motion.div>

      {/* ── STICKY BOTTOM ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 safe-bottom"
        style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>

        <AnimatePresence mode="wait">
          {qty === 0 ? (
            <motion.button
              key="add"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAdd}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 text-white transition-all"
              style={{
                background: added ? '#10B981' : PRIMARY,
                boxShadow: added
                  ? '0 4px 20px rgba(16,185,129,0.35)'
                  : `0 4px 24px rgba(255,107,53,0.35)`,
              }}
            >
              {added
                ? <><Check size={18} strokeWidth={2.5} /> {t('thankYou')}</>
                : <><ShoppingBag size={18} /> {t('addToCart')} — {formatPrice(item.price)}</>
              }
            </motion.button>
          ) : (
            <motion.div
              key="stepper"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="flex items-center gap-3"
            >
              {/* Qty control */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200">
                <motion.button whileTap={{ scale: 0.8 }}
                  onClick={() => updateQty(item.id, qty - 1)}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: PRIMARY, color: PRIMARY }}>
                  <Minus size={14} strokeWidth={2.5} />
                </motion.button>
                <span className="text-gray-900 font-black text-xl w-6 text-center">{qty}</span>
                <motion.button whileTap={{ scale: 0.8 }}
                  onClick={() => addItem(item)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ background: PRIMARY }}>
                  <Plus size={14} strokeWidth={2.5} />
                </motion.button>
              </div>

              {/* Go to cart */}
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => router.push(`/cart?table=${tableNumber}`)}
                className="flex-1 py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
                style={{ background: PRIMARY, boxShadow: `0 4px 16px rgba(255,107,53,0.3)` }}>
                <ShoppingBag size={16} />
                {t('cart')} · {formatPrice(item.price * qty)}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
