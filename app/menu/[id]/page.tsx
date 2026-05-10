'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Minus, Plus, MessageSquare, Star, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MenuItem } from '@/types'
import { supabase } from '@/lib/supabase'
import { MOCK_MENU, IS_MOCK_MODE } from '@/lib/mock-data'
import { useLang } from '@/context/LanguageContext'
import { useCart } from '@/context/CartContext'
import { getItemName, getItemDescription } from '@/lib/i18n'
import { formatPrice, discountedPrice } from '@/lib/utils'

const PRIMARY = '#FF6B35'

export default function MenuDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const { lang, t, isRTL } = useLang()
  const { items: cartItems, addItem, updateQty } = useCart()

  const [item, setItem]     = useState<MenuItem | null>(null)
  const [loading, setLoad]  = useState(true)
  const [table, setTable]   = useState('1')
  const [notes, setNotes]   = useState('')
  const [added, setAdded]   = useState(false)

  const cartItem = item ? cartItems.find(i => i.id === item.id) : null
  const qty = cartItem?.qty ?? 0

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTable(p.get('table') ?? '1')
  }, [])

  useEffect(() => {
    async function load() {
      setLoad(true)
      if (IS_MOCK_MODE) { setItem(MOCK_MENU.find(m => m.id === id) ?? null); setLoad(false); return }
      const { data } = await supabase.from('menu').select('*').eq('id', id).single()
      setItem(data as MenuItem ?? null)
      setLoad(false)
    }
    load()
  }, [id])

  function handleAdd() {
    if (!item) return
    addItem(item, notes.trim() || undefined)
    setAdded(true)
    setTimeout(() => { setAdded(false); router.back() }, 900)
  }

  const name  = item ? getItemName(item, lang) : ''
  const desc  = item ? getItemDescription(item, lang) : ''
  const hasDiscount = (item?.discount_percent ?? 0) > 0
  const finalPrice  = item ? discountedPrice(item.price, item.discount_percent) : 0
  const savings     = item ? item.price - finalPrice : 0

  const notePlaceholder: Record<string, string> = {
    id: 'Tambah catatan... (tanpa bawang, tidak pedas...)',
    en: 'Add notes... (no onion, less spicy...)',
    ar: 'أضف ملاحظات... (بدون بصل، أقل حرارة...)',
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-end"
        style={{ background: 'linear-gradient(to bottom, #FFF3EE, #FAFAF8)' }}>
        <div className="w-full bg-white rounded-t-[28px] h-[80dvh] animate-pulse" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-dvh bg-[#FAFAF8] flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-gray-400 text-sm mb-4">{t('noItems')}</p>
          <button onClick={() => router.back()}
            className="px-6 py-3 rounded-full text-white font-bold text-sm"
            style={{ background: PRIMARY }}>{t('backToMenu')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col justify-end relative" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Warm blurred background (bukan hitam) ── */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Blurred food image as background */}
        {item.image && (
          <Image src={item.image} alt="" fill className="object-cover scale-110"
            style={{ filter: 'blur(24px) saturate(0.7) brightness(0.6)' }} sizes="100vw" />
        )}
        {/* Warm gradient overlay */}
        <div className="absolute inset-0"
          style={{
            background: item.image
              ? 'linear-gradient(to bottom, rgba(30,15,5,0.55) 0%, rgba(15,8,3,0.7) 100%)'
              : 'linear-gradient(to bottom, #FFF3EE 0%, #FFE8D8 40%, #FAFAF8 100%)',
          }} />
      </div>

      {/* Backdrop — tap to close */}
      <div className="absolute inset-0 z-0" onClick={() => router.back()} />

      {/* ── Bottom sheet ── */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="relative z-10 bg-white rounded-t-[28px] overflow-hidden max-h-[92dvh] flex flex-col"
        style={{ boxShadow: '0 -12px 48px rgba(0,0,0,0.2)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3.5 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Food image inside sheet */}
        <div className="relative mx-4 mt-3 rounded-2xl overflow-hidden bg-amber-50 flex-shrink-0"
          style={{ height: '230px' }}>
          <Image src={item.image || '/hero-food.png'} alt={name} fill
            className="object-cover" priority sizes="100vw" />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(255,248,235,0.25), transparent 55%)' }} />

          {/* X button */}
          <button onClick={() => router.back()}
            className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
            <X size={18} className="text-gray-700" />
          </button>

          {/* Badges on image */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {hasDiscount && (
              <motion.span
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="flex items-center gap-1 text-white text-[11px] font-black px-3 py-1.5 rounded-full shadow-lg"
                style={{ background: 'linear-gradient(135deg,#EF4444,#FF6B35)' }}>
                🏷 -{item.discount_percent}% {lang === 'ar' ? 'خصم' : lang === 'id' ? 'DISKON' : 'OFF'}
              </motion.span>
            )}
            {item.is_best_seller && (
              <span className="flex items-center gap-1 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md"
                style={{ background: PRIMARY }}>
                <Star size={9} fill="white" />
                {lang === 'ar' ? 'الأكثر مبيعاً' : lang === 'id' ? 'TERLARIS' : 'BEST SELLER'}
              </span>
            )}
          </div>

          {/* Cook time + calories bottom-left */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            <div className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/90">
              <Clock size={9} /> {item.cook_time}m
            </div>
            {item.calories && (
              <div className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/90">
                🔥 {item.calories} kcal
              </div>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2">

          {/* Name + Price row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="font-black text-gray-900 text-xl leading-tight flex-1">{name}</h1>
            <div className="flex-shrink-0 text-right">
              <p className="font-black text-xl" style={{ color: PRIMARY }}>{formatPrice(finalPrice)}</p>
              {hasDiscount && (
                <p className="text-xs text-gray-400 line-through mt-0.5">{formatPrice(item.price)}</p>
              )}
            </div>
          </div>

          {/* Savings badge */}
          {hasDiscount && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-2xl"
              style={{ background: '#FFF0EE', border: '1px solid #FFD5C4' }}>
              <span className="text-lg">💰</span>
              <div>
                <p className="text-xs font-black" style={{ color: '#EF4444' }}>
                  {lang === 'ar' ? `وفّر ${formatPrice(savings)}!` :
                   lang === 'id' ? `Hemat ${formatPrice(savings)}!` :
                   `Save ${formatPrice(savings)}!`}
                </p>
                <p className="text-[10px]" style={{ color: '#C07060' }}>
                  {lang === 'ar' ? `بدلاً من ${formatPrice(item.price)}` :
                   lang === 'id' ? `dari harga normal ${formatPrice(item.price)}` :
                   `Regular price ${formatPrice(item.price)}`}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {desc && (
            <p className="text-gray-400 text-sm leading-relaxed mb-4">{desc}</p>
          )}

          {/* Notes */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={14} style={{ color: PRIMARY }} />
              <span className="text-[11px] font-black tracking-[2px] uppercase"
                style={{ color: '#8A7A6A' }}>{t('notes')}</span>
            </div>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder={notePlaceholder[lang] ?? notePlaceholder.en}
              rows={2} dir={isRTL ? 'rtl' : 'ltr'}
              className="w-full rounded-2xl px-4 py-3 text-sm text-gray-700 outline-none resize-none"
              style={{ background: '#F5F2EE', border: '1.5px solid transparent', transition: 'border-color 0.15s' }}
              onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
              onBlur={e => (e.currentTarget.style.borderColor = 'transparent')}
            />
          </div>
        </div>

        {/* Sticky bottom */}
        <div className="px-5 pt-3 pb-6 safe-bottom flex-shrink-0"
          style={{ borderTop: '1px solid #F0ECE6' }}>

          {/* Qty row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 bg-[#F5F2EE] rounded-full px-2 py-1.5">
              <motion.button whileTap={{ scale: 0.82 }}
                onClick={() => qty > 0 ? updateQty(item.id, qty - 1) : null}
                className="w-10 h-10 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center"
                style={{ color: '#555' }}>
                <Minus size={16} strokeWidth={2.5} />
              </motion.button>
              <span className="font-black text-gray-900 text-xl w-6 text-center">{Math.max(qty, 1)}</span>
              <motion.button whileTap={{ scale: 0.82 }}
                onClick={() => addItem(item)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ background: PRIMARY, boxShadow: `0 4px 14px rgba(255,107,53,0.4)` }}>
                <Plus size={16} strokeWidth={2.5} />
              </motion.button>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-black tracking-[2px] uppercase mb-0.5" style={{ color: '#9A8A7A' }}>
                SUBTOTAL
              </p>
              <p className="font-black text-2xl leading-tight" style={{ color: '#1A1208' }}>
                {formatPrice(finalPrice * Math.max(qty, 1))}
              </p>
              {hasDiscount && (
                <p className="text-[10px] text-gray-400 line-through">
                  {formatPrice(item.price * Math.max(qty, 1))}
                </p>
              )}
            </div>
          </div>

          {/* Add to cart */}
          <motion.button
            whileTap={{ scale: 0.97 }} onClick={handleAdd} disabled={added}
            className="w-full rounded-full py-[18px] font-black text-white text-[16px] tracking-wide flex items-center justify-center gap-3"
            style={{
              background: added ? '#22C55E' : PRIMARY,
              boxShadow: added ? '0 6px 20px rgba(34,197,94,0.35)' : `0 6px 24px rgba(255,107,53,0.42)`,
              transition: 'background 0.3s',
              letterSpacing: '0.04em',
            }}>
            {added
              ? <>✓ {t('thankYou')}</>
              : <>{t('addToCart')} · {formatPrice(finalPrice * Math.max(qty, 1))}</>
            }
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
