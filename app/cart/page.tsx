'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'
import { useLang } from '@/context/LanguageContext'
import { formatPrice, calculateCartTotal } from '@/lib/utils'
import { getItemName } from '@/lib/i18n'

export default function CartPage() {
  const router = useRouter()
  const [tableNumber, setTableNumber] = useState('1')
  const { lang, t, isRTL } = useLang()
  const { items, removeItem, updateQty, totalItems } = useCart()

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
  }, [])

  const total = calculateCartTotal(items)

  if (items.length === 0) {
    return (
      <div className="min-h-dvh bg-[#0D0D0D] flex flex-col items-center justify-center p-8 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <ShoppingBag size={64} className="text-[#D4AF37]/30 mb-6" />
        <h2 className="font-display text-2xl font-bold text-white mb-2">{t('emptyCart')}</h2>
        <p className="text-[#666] mb-8">{t('emptyCartSub')}</p>
        <button
          onClick={() => router.push(`/menu?table=${tableNumber}`)}
          className="bg-[#D4AF37] text-[#0D0D0D] font-bold px-8 py-3.5 rounded-2xl"
        >
          {t('continueShopping')}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#0D0D0D] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#D4AF37]/4 rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-[#D4AF37]/12">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.push(`/menu?table=${tableNumber}`)}
            className="p-2 rounded-xl hover:bg-[#1A1A1A] text-[#888] hover:text-white transition-colors"
          >
            <ArrowLeft size={20} className={isRTL ? 'rotate-180' : ''} />
          </button>
          <h1 className="font-display text-xl font-bold text-white">{t('yourCart')}</h1>
          <span className="ml-auto text-[#666] text-sm">{totalItems} {t('items')}</span>
        </div>
      </header>

      {/* Items */}
      <main className="flex-1 px-4 py-4 pb-44 space-y-3">
        {items.map((item, idx) => {
          const name = getItemName(item, lang)
          return (
            <div
              key={item.id}
              className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-4 flex gap-3 items-start"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Image */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#222] flex-shrink-0">
                <Image
                  src={item.image || `https://placehold.co/80x80/222/D4AF37?text=${encodeURIComponent(name[0])}`}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm line-clamp-1">{name}</h3>
                <p className="text-[#D4AF37] font-bold text-sm mt-0.5">{formatPrice(item.price)}</p>
                {item.itemNotes && (
                  <p className="text-[#555] text-[11px] mt-1 italic">📝 {item.itemNotes}</p>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-col items-end gap-2">
                <button onClick={() => removeItem(item.id)} className="text-[#444] hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
                <div className="flex items-center gap-2 bg-[#0D0D0D] rounded-full border border-[#D4AF37]/20 px-1.5 py-0.5">
                  <button
                    onClick={() => updateQty(item.id, item.qty - 1)}
                    className="w-5 h-5 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-full transition-colors"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="text-white font-bold text-xs w-4 text-center">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, item.qty + 1)}
                    className="w-5 h-5 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-full transition-colors"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </main>

      {/* Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D]/98 backdrop-blur-xl border-t border-[#D4AF37]/12 p-4 safe-bottom">
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-white text-base">{t('total')}</span>
          <span className="font-black text-[#D4AF37] text-xl">{formatPrice(total)}</span>
        </div>
        <button
          onClick={() => router.push(`/checkout?table=${tableNumber}`)}
          className="w-full bg-[#D4AF37] text-[#0D0D0D] py-4 rounded-2xl font-black text-base shadow-[0_4px_24px_rgba(212,175,55,0.35)] active:scale-[0.98] transition-transform"
        >
          {t('checkout')}
        </button>
      </div>
    </div>
  )
}
