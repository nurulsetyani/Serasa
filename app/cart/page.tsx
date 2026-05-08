'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/context/CartContext'
import { useLang } from '@/context/LanguageContext'
import { formatPrice, calculateCartTotal, discountedPrice } from '@/lib/utils'
import { getItemName } from '@/lib/i18n'

const P = '#FF6B35'

export default function CartPage() {
  const router = useRouter()
  const [table, setTable] = useState('1')
  const { lang, t, isRTL } = useLang()
  const { items, removeItem, updateQty, addItem, totalItems } = useCart()

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTable(p.get('table') ?? '1')
  }, [])

  const total = calculateCartTotal(items)

  if (items.length === 0) {
    return (
      <div className="min-h-dvh bg-[#FAFAF8] flex flex-col items-center justify-center p-8 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
          style={{ background: `${P}12` }}>
          <ShoppingBag size={36} style={{ color: P }} />
        </div>
        <h2 className="font-black text-gray-900 text-xl mb-2">{t('emptyCart')}</h2>
        <p className="text-gray-400 text-sm mb-8">{t('emptyCartSub')}</p>
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => router.push(`/menu?table=${table}`)}
          className="px-8 py-4 rounded-full text-white font-black"
          style={{ background: P, boxShadow: `0 8px 24px rgba(255,107,53,0.4)` }}>
          {t('continueShopping')}
        </motion.button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#FAFAF8] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.push(`/menu?table=${table}`)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <ArrowLeft size={17} className={`text-gray-600 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <h1 className="font-black text-gray-900 text-base">{t('yourCart')}</h1>
          <span className="text-gray-400 text-sm ml-auto">{totalItems} {t('items')}</span>
        </div>
      </header>

      {/* Items */}
      <main className="flex-1 px-4 py-4 pb-36 space-y-3">
        <AnimatePresence>
          {items.map(item => {
            const name = getItemName(item, lang)
            return (
              <motion.div key={item.id} layout
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-2xl p-4 flex gap-3 items-center"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F0EAE0' }}>
                {/* Image */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-amber-50 flex-shrink-0">
                  <Image src={item.image || '/hero-food.png'} alt={name} fill className="object-cover" sizes="64px" />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm line-clamp-1">{name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="font-black text-sm" style={{ color: P }}>{formatPrice(discountedPrice(item.price, item.discount_percent))}</p>
                    {(item.discount_percent ?? 0) > 0 && <span className="text-[9px] text-gray-400 line-through">{formatPrice(item.price)}</span>}
                  </div>
                  {item.itemNotes && <p className="text-gray-400 text-[11px] mt-0.5 italic">{item.itemNotes}</p>}
                </div>
                {/* Controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <motion.button whileTap={{ scale: 0.8 }}
                    onClick={() => updateQty(item.id, item.qty - 1)}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">
                    {item.qty === 1 ? <Trash2 size={12} className="text-red-400" /> : <Minus size={12} className="text-gray-500" />}
                  </motion.button>
                  <span className="font-black text-gray-900 w-5 text-center">{item.qty}</span>
                  <motion.button whileTap={{ scale: 0.8 }}
                    onClick={() => addItem(item)}
                    className="w-8 h-8 rounded-full text-white flex items-center justify-center"
                    style={{ background: P }}>
                    <Plus size={12} />
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </main>

      {/* Bottom */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 safe-bottom bg-[#FAFAF8] pt-3"
        style={{ boxShadow: '0 -8px 24px rgba(0,0,0,0.04)' }}>
        <div className="flex justify-between items-center mb-4">
          <span className="font-black text-gray-900">{t('total')}</span>
          <span className="font-black text-2xl" style={{ color: P }}>{formatPrice(total)}</span>
        </div>
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => router.push(`/checkout?table=${table}`)}
          className="w-full py-[18px] rounded-full text-white font-black text-[16px] flex items-center justify-between px-6"
          style={{ background: P, boxShadow: `0 8px 28px rgba(255,107,53,0.42)` }}>
          <span>{t('checkout')}</span>
          <div className="flex items-center gap-1 bg-white/20 rounded-xl px-3 py-1.5">
            <span className="text-sm font-bold">{formatPrice(total)}</span>
            <ChevronRight size={14} />
          </div>
        </motion.button>
      </div>
    </div>
  )
}
