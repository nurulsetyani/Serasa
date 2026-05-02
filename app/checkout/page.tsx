'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, MapPin, CheckCircle, UtensilsCrossed, ShoppingBag, Banknote, Smartphone } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useLang } from '@/context/LanguageContext'
import { formatPrice, calculateCartTotal } from '@/lib/utils'
import { getItemName } from '@/lib/i18n'
import { IS_MOCK_MODE } from '@/lib/mock-data'
import { OrderType, PaymentMethod } from '@/types'

type OrderTypeOption = { value: OrderType; icon: React.ElementType; labelKey: 'dineIn' | 'takeAway' }
type PaymentOption  = { value: PaymentMethod; icon: React.ElementType; labelKey: 'cash' | 'online' }

const ORDER_TYPES: OrderTypeOption[] = [
  { value: 'dine_in',   icon: UtensilsCrossed, labelKey: 'dineIn' },
  { value: 'take_away', icon: ShoppingBag,     labelKey: 'takeAway' },
]

const PAYMENT_METHODS: PaymentOption[] = [
  { value: 'cash',   icon: Banknote,    labelKey: 'cash' },
  { value: 'online', icon: Smartphone,  labelKey: 'online' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const [tableNumber, setTableNumber] = useState('1')
  const { lang, t, isRTL } = useLang()
  const { items, clearCart } = useCart()

  const [customerName, setCustomerName]     = useState('')
  const [orderType, setOrderType]           = useState<OrderType>('dine_in')
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod>('cash')
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const [submitted, setSubmitted]           = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
  }, [])

  const total = calculateCartTotal(items)

  async function handleSubmit() {
    if (submitted || loading || !customerName.trim() || !items.length) return
    setSubmitted(true)
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
          order_type: orderType,
          payment_method: paymentMethod,
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
      setSubmitted(false)
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

      <div className="flex-1 px-4 py-6 space-y-5 pb-36">

        {/* Table info */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#D4AF37]/8 border border-[#D4AF37]/20">
          <MapPin size={20} className="text-[#D4AF37] flex-shrink-0" />
          <div>
            <p className="text-[#888] text-xs">{t('tableNumber')}</p>
            <p className="text-white font-bold text-lg">{tableNumber}</p>
          </div>
        </div>

        {/* Customer name */}
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

        {/* Order type */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#888]">{t('orderType')}</p>
          <div className="grid grid-cols-2 gap-3">
            {ORDER_TYPES.map(({ value, icon: Icon, labelKey }) => (
              <button
                key={value}
                type="button"
                onClick={() => setOrderType(value)}
                className="relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: orderType === value ? 'rgba(212,175,55,0.08)' : '#1A1A1A',
                  borderColor: orderType === value ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.06)',
                  boxShadow: orderType === value ? '0 0 0 1px rgba(212,175,55,0.2)' : undefined,
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: orderType === value ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)' }}>
                  <Icon size={20} style={{ color: orderType === value ? '#D4AF37' : '#666' }} />
                </div>
                <span className="text-sm font-semibold"
                  style={{ color: orderType === value ? '#D4AF37' : '#888' }}>
                  {t(labelKey)}
                </span>
                {orderType === value && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#D4AF37] flex items-center justify-center">
                    <CheckCircle size={10} className="text-[#0D0D0D]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Payment method */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#888]">{t('paymentMethod')}</p>
          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map(({ value, icon: Icon, labelKey }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPaymentMethod(value)}
                className="relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: paymentMethod === value ? 'rgba(212,175,55,0.08)' : '#1A1A1A',
                  borderColor: paymentMethod === value ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.06)',
                  boxShadow: paymentMethod === value ? '0 0 0 1px rgba(212,175,55,0.2)' : undefined,
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: paymentMethod === value ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)' }}>
                  <Icon size={20} style={{ color: paymentMethod === value ? '#D4AF37' : '#666' }} />
                </div>
                <span className="text-sm font-semibold"
                  style={{ color: paymentMethod === value ? '#D4AF37' : '#888' }}>
                  {t(labelKey)}
                </span>
                {paymentMethod === value && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#D4AF37] flex items-center justify-center">
                    <CheckCircle size={10} className="text-[#0D0D0D]" />
                  </div>
                )}
              </button>
            ))}
          </div>
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
          disabled={loading || submitted || !customerName.trim() || !items.length}
          className="w-full bg-[#D4AF37] text-[#0D0D0D] py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(212,175,55,0.35)] disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {loading
            ? <><span className="animate-spin">⟳</span> {t('processing')}</>
            : <><CheckCircle size={18} /> {t('placeOrder')}</>
          }
        </button>
      </div>
    </div>
  )
}
