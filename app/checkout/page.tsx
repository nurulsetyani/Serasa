'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, User, FileText, MapPin, CheckCircle } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useLang } from '@/context/LanguageContext'
import { formatPrice, calculateCartTotal } from '@/lib/utils'
import { getItemName } from '@/lib/i18n'
import { IS_MOCK_MODE } from '@/lib/mock-data'

function CheckoutContent() {
  const router = useRouter()
  const params = useSearchParams()
  const tableNumber = params.get('table') ?? '1'
  const { lang, t, isRTL } = useLang()
  const { items, promoDiscount, clearCart } = useCart()

  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { subtotal, discount, total } = calculateCartTotal(items, promoDiscount)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerName.trim()) return
    if (!items.length) { router.push(`/?table=${tableNumber}`); return }

    setLoading(true)
    setError('')

    try {
      // Mock mode: simulate order without Supabase
      if (IS_MOCK_MODE) {
        await new Promise(r => setTimeout(r, 1200))
        clearCart()
        router.push(`/order/mock-preview-order?table=${tableNumber}`)
        return
      }

      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          table_number: tableNumber,
          notes: notes.trim(),
          total_price: total,
          items: items.map(i => ({
            menu_id: i.id,
            name: getItemName(i, 'en'),
            price: i.promo_price ?? i.price,
            qty: i.qty,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create order')

      clearCart()
      router.push(`/order/${data.id}?table=${tableNumber}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-obsidian flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Decorative */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold/4 rounded-full blur-[100px]" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-obsidian/90 backdrop-blur-xl border-b border-gold-border safe-top">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-obsidian-surface text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft size={20} className={isRTL ? 'rotate-180' : ''} />
          </button>
          <h1 className="font-display text-xl font-bold text-ink">{t('checkoutTitle')}</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-4 py-6 gap-6 pb-32">
        {/* Table info */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-gold-muted border border-gold-border">
          <MapPin size={20} className="text-gold" />
          <div>
            <p className="text-ink-muted text-xs">{t('tableNumber')}</p>
            <p className="text-ink font-bold text-lg">{tableNumber}</p>
          </div>
        </div>

        {/* Customer name */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-muted">
            <User size={14} />
            {t('yourName')} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder={t('namePlaceholder')}
            required
            className="input-dark w-full px-4 py-3.5 text-sm"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-muted">
            <FileText size={14} />
            {t('notes')}
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t('notesPlaceholder')}
            rows={3}
            className="input-dark w-full px-4 py-3 text-sm resize-none"
          />
        </div>

        {/* Order summary */}
        <div className="card-dark p-4 space-y-3">
          <h3 className="font-semibold text-ink text-sm">{t('orderSummary')}</h3>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-ink-muted">{getItemName(item, lang)} × {item.qty}</span>
                <span className="text-ink">{formatPrice((item.promo_price ?? item.price) * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gold-border pt-3 space-y-1.5">
            {promoDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-400">{t('discount')} ({promoDiscount}%)</span>
                <span className="text-green-400">-{formatPrice(subtotal - total)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold">
              <span className="text-ink">{t('total')}</span>
              <span className="text-gold text-lg">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}
      </form>

      {/* Submit button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-obsidian/95 backdrop-blur-xl border-t border-gold-border">
        <button
          form="checkout-form"
          onClick={handleSubmit}
          disabled={loading || !customerName.trim() || !items.length}
          className="btn-gold w-full py-4 text-base font-bold flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="animate-spin">⟳</span> {t('processing')}</>
          ) : (
            <><CheckCircle size={18} /> {t('placeOrder')}</>
          )}
        </button>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-obsidian flex items-center justify-center"><div className="text-gold text-4xl animate-spin">⟳</div></div>}>
      <CheckoutContent />
    </Suspense>
  )
}
