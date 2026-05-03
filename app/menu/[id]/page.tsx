'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Minus, Plus, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { MenuItem } from '@/types'
import { supabase } from '@/lib/supabase'
import { MOCK_MENU, IS_MOCK_MODE } from '@/lib/mock-data'
import { useLang } from '@/context/LanguageContext'
import { useCart } from '@/context/CartContext'
import { getItemName, getItemDescription } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'

const PRIMARY = '#F0A030'

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

  const name = item ? getItemName(item, lang) : ''
  const desc = item ? getItemDescription(item, lang) : ''
  const subtotal = item ? formatPrice(item.price * Math.max(qty, 1)) : '0 SR'

  const notePlaceholder: Record<string, string> = {
    id: 'Tambah catatan... (tanpa bawang, tidak pedas...)',
    en: 'Add notes... (no onion, less spicy...)',
    ar: 'أضف ملاحظات... (بدون بصل، أقل حرارة...)',
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-black/40 flex items-end">
        <div className="w-full bg-white rounded-t-[28px] h-[80dvh] animate-pulse" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-dvh bg-[#FAFAF8] flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-gray-400 text-sm mb-4">Menu tidak ditemukan</p>
          <button onClick={() => router.back()}
            className="px-6 py-3 rounded-full text-white font-bold text-sm"
            style={{ background: PRIMARY }}>Kembali</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-black/50 flex flex-col justify-end" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Backdrop — tap to close */}
      <div className="absolute inset-0" onClick={() => router.back()} />

      {/* Bottom sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="relative z-10 bg-white rounded-t-[28px] overflow-hidden max-h-[92dvh] flex flex-col"
        style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3.5 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Food image */}
        <div className="relative mx-4 mt-3 rounded-2xl overflow-hidden bg-amber-50 flex-shrink-0"
          style={{ height: '240px' }}>
          <Image
            src={item.image || '/hero-food.png'}
            alt={name} fill className="object-cover"
            priority sizes="100vw"
          />
          {/* Very light warm overlay */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(255,248,235,0.2), transparent 50%)' }} />

          {/* X button */}
          <button
            onClick={() => router.back()}
            className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
            <X size={18} className="text-gray-700" />
          </button>

          {/* Best seller badge */}
          {item.is_best_seller && (
            <div className="absolute bottom-3 left-3">
              <span className="flex items-center gap-1.5 text-white text-[11px] font-black px-4 py-2 rounded-full tracking-wider"
                style={{ background: PRIMARY }}>
                ⚡ BEST SELLER
              </span>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2">

          {/* Name + price */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="font-black text-gray-900 text-xl leading-tight flex-1">{name}</h1>
            <span className="font-black text-xl flex-shrink-0" style={{ color: PRIMARY }}>
              {formatPrice(item.price)}
            </span>
          </div>

          {desc && (
            <p className="text-gray-400 text-sm leading-relaxed mb-4">{desc}</p>
          )}

          {/* Notes */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={14} style={{ color: PRIMARY }} />
              <span className="text-[11px] font-black tracking-[2px] uppercase"
                style={{ color: '#8A7A6A' }}>
                {t('notes')}
              </span>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={notePlaceholder[lang] ?? notePlaceholder.en}
              rows={2}
              dir={isRTL ? 'rtl' : 'ltr'}
              className="w-full rounded-2xl px-4 py-3 text-sm text-gray-700 outline-none resize-none"
              style={{
                background: '#F5F2EE',
                border: '1.5px solid transparent',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = PRIMARY)}
              onBlur={e => (e.currentTarget.style.borderColor = 'transparent')}
            />
          </div>
        </div>

        {/* Sticky bottom — qty + CTA */}
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
                style={{ background: PRIMARY, boxShadow: `0 4px 14px rgba(240,160,48,0.4)` }}>
                <Plus size={16} strokeWidth={2.5} />
              </motion.button>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold tracking-[2px] uppercase" style={{ color: '#9A8A7A' }}>
                SUBTOTAL
              </p>
              <p className="font-black text-2xl leading-tight" style={{ color: '#1A1208' }}>
                {item.price * Math.max(qty, 1)} <span className="text-sm font-bold text-gray-400">SR</span>
              </p>
            </div>
          </div>

          {/* Add to cart */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAdd}
            disabled={added}
            className="w-full rounded-full py-[18px] font-black text-white text-[16px] tracking-wide flex items-center justify-center gap-3"
            style={{
              background: added ? '#22C55E' : PRIMARY,
              boxShadow: added
                ? '0 6px 20px rgba(34,197,94,0.35)'
                : `0 6px 24px rgba(240,160,48,0.42)`,
              transition: 'background 0.3s',
              letterSpacing: '0.04em',
            }}
          >
            {added ? (
              <>✓ DITAMBAHKAN!</>
            ) : (
              <>
                ADD TO CART
                <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                <span>{item.price * Math.max(qty, 1)} SAR</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
