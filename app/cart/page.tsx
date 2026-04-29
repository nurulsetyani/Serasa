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

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
  }, [])
  const { lang, t, isRTL } = useLang()
  const { items, removeItem, updateQty, promoDiscount } = useCart()

  const { subtotal, discount, total } = calculateCartTotal(items, promoDiscount)

  if (items.length === 0) {
    return (
      <div className="min-h-dvh bg-obsidian flex flex-col items-center justify-center p-8 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <ShoppingBag size={64} className="text-gold-dark mb-6 opacity-40" />
        <h2 className="font-display text-2xl font-bold text-ink mb-2">{t('emptyCart')}</h2>
        <p className="text-ink-muted mb-8">{t('emptyCartSub')}</p>
        <button onClick={() => router.push(`/?table=${tableNumber}`)} className="btn-gold px-8 py-3">
          {t('continueShopping')}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-obsidian flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Decorative */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-gold/4 rounded-full blur-[80px]" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-obsidian/90 backdrop-blur-xl border-b border-gold-border safe-top">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.push(`/?table=${tableNumber}`)}
            className="p-2 rounded-xl hover:bg-obsidian-surface text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft size={20} className={isRTL ? 'rotate-180' : ''} />
          </button>
          <h1 className="font-display text-xl font-bold text-ink">{t('yourCart')}</h1>
          <span className="ml-auto text-ink-muted text-sm">{items.reduce((s, i) => s + i.qty, 0)} {t('items')}</span>
        </div>
      </header>

      {/* ITEMS */}
      <main className="flex-1 px-4 py-4 pb-48 space-y-3">
        {items.map((item, idx) => {
          const name = getItemName(item, lang)
          const displayPrice = item.promo_price ?? item.price

          return (
            <div
              key={item.id}
              className="card-dark p-4 flex gap-3 items-center"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Image */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-obsidian-surface flex-shrink-0">
                <Image
                  src={item.image || `https://placehold.co/80x80/1a1a1a/D4AF37?text=${encodeURIComponent(name[0])}`}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-ink text-sm line-clamp-1">{name}</h3>
                <p className="text-gold font-bold text-sm mt-0.5">{formatPrice(displayPrice)}</p>
              </div>

              {/* Controls */}
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-ink-faint hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>

                <div className="flex items-center gap-2 bg-obsidian rounded-full border border-gold-border px-1.5 py-0.5">
                  <button
                    onClick={() => updateQty(item.id, item.qty - 1)}
                    className="w-5 h-5 flex items-center justify-center text-gold hover:bg-gold-muted rounded-full transition-colors"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="text-ink font-bold text-xs w-4 text-center">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, item.qty + 1)}
                    className="w-5 h-5 flex items-center justify-center text-gold hover:bg-gold-muted rounded-full transition-colors"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </main>

      {/* SUMMARY + CHECKOUT */}
      <div className="fixed bottom-0 left-0 right-0 bg-obsidian/95 backdrop-blur-xl border-t border-gold-border p-4 safe-bottom">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">{t('subtotal')}</span>
            <span className="text-ink">{formatPrice(subtotal)}</span>
          </div>
          {promoDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-400">{t('discount')} ({promoDiscount}%)</span>
              <span className="text-green-400">-{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gold-border pt-2">
            <span className="font-bold text-ink">{t('total')}</span>
            <span className="font-bold text-gold text-lg">{formatPrice(total)}</span>
          </div>
        </div>
        <button
          onClick={() => router.push(`/checkout?table=${tableNumber}`)}
          className="btn-gold w-full py-4 text-base font-bold"
        >
          {t('checkout')}
        </button>
      </div>
    </div>
  )
}
