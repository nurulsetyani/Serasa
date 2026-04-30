'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, MapPin, CheckCircle } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useLang } from '@/context/LanguageContext'
import { formatPrice, calculateCartTotal } from '@/lib/utils'
import { getItemName } from '@/lib/i18n'
import { IS_MOCK_MODE } from '@/lib/mock-data'

export default function CheckoutPage() {
  const router = useRouter()
  const [tableNumber, setTableNumber] = useState('1')
  const { lang, t, isRTL } = useLang()
  const { items, clearCart } = useCart()

  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
  }, [])

  const total = calculateCartTotal(items)

  async function handleSubmit() {
    if (!customerName.trim() || !items.length) return
    setLoading(true)
    setError('')

    try {
      if (IS_MOCK_MODE) {
        await new Promise(r => setTimeout(r, 1000))
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
          total_price: total,
          items: items.map(i => ({
            menu_id: i.id,
            name: getItemName(i, 'en'),
            price: i.price,
            qty: i.qty,
            notes: i.itemNotes ?? null,
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
    <div className="min-h-dvh bg-[#0D0D0D] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/4 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-[#D4AF37]/12">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-[#1A1A1A] text-[#888] hover:text-white transition-colors">
            <ArrowLeft size={20} className={isRTL ? 'rotate-180' : ''} />
          </button>
          <h1 className="font-display text-xl font-bold text-white">{t('checkoutTitle')}</h1>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 space-y-5 pb-32">
        {/* Table */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#D4AF37]/8 border border-[#D4AF37]/20">
          <MapPin size={20} className="text-[#D4AF37]" />
          <div>
            <p className="text-[#888] text-xs">{t('tableNumber')}</p>
            <p className="text-white font-bold text-lg">{tableNumber}</p>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#888]">
            <User size={14} /> {t('yourName')} <span className="text-red-400">*</span>
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

        {/* Order summary */}
        <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-4 space-y-3">
          <h3 className="font-semibold text-white text-sm">{t('orderSummary')}</h3>
          <div className="space-y-2.5">
            {items.map(item => (
              <div key={item.id} className="flex justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-[#888] text-sm">{getItemName(item, lang)} × {item.qty}</span>
                  {item.itemNotes && (
                    <p className="text-[#555] text-[11px] italic mt-0.5">📝 {item.itemNotes}</p>
                  )}
                </div>
                <span className="text-white text-sm flex-shrink-0">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#D4AF37]/15 pt-3 flex justify-between font-bold">
            <span className="text-white">{t('total')}</span>
            <span className="text-[#D4AF37] text-lg">{formatPrice(total)}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-[#0D0D0D]/98 backdrop-blur-xl border-t border-[#D4AF37]/12">
        <button
          onClick={handleSubmit}
          disabled={loading || !customerName.trim() || !items.length}
          className="w-full bg-[#D4AF37] text-[#0D0D0D] py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(212,175,55,0.35)] disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {loading ? <><span className="animate-spin">⟳</span> {t('processing')}</> : <><CheckCircle size={18} /> {t('placeOrder')}</>}
        </button>
      </div>
    </div>
  )
}
