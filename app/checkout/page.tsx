'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, MapPin, CheckCircle, UtensilsCrossed, ShoppingBag, Banknote, Smartphone, QrCode } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCart } from '@/context/CartContext'
import { useLang } from '@/context/LanguageContext'
import { formatPrice, calculateCartTotal } from '@/lib/utils'
import { getItemName } from '@/lib/i18n'
import { IS_MOCK_MODE } from '@/lib/mock-data'
import { OrderType, PaymentMethod } from '@/types'

const PRIMARY = '#FF6B35'

type OrderTypeOption   = { value: OrderType;     icon: React.ElementType; labelKey: 'dineIn' | 'takeAway' }
type PaymentOption     = { value: PaymentMethod;  icon: React.ElementType; labelKey: 'cash' | 'online' | 'qris' }

const ORDER_TYPES: OrderTypeOption[] = [
  { value: 'dine_in',   icon: UtensilsCrossed, labelKey: 'dineIn' },
  { value: 'take_away', icon: ShoppingBag,     labelKey: 'takeAway' },
]
const PAYMENT_METHODS: PaymentOption[] = [
  { value: 'cash',   icon: Banknote,    labelKey: 'cash' },
  { value: 'online', icon: Smartphone,  labelKey: 'online' },
  { value: 'qris',   icon: QrCode,      labelKey: 'qris' },
]

// ─── Success Screen ────────────────────────────────────────
function SuccessScreen({
  orderNumber, tableNumber, onTrack,
}: {
  orderNumber: string; tableNumber: string; onTrack: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-dvh bg-[#FAFAFA] flex flex-col items-center justify-center px-6 text-center"
    >
      {/* Circle check */}
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ background: `${PRIMARY}15` }}
      >
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.25 }}
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: PRIMARY }}
        >
          <CheckCircle size={32} className="text-white" strokeWidth={2.5} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="font-black text-gray-900 text-2xl mb-2">Pesanan Diterima!</h1>
        <p className="text-gray-500 text-sm mb-1">Dapur sedang memproses pesananmu</p>
        <p className="text-gray-400 text-xs mb-6">Meja {tableNumber}</p>

        {/* Order number */}
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-5 py-3 mb-8"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <span className="text-gray-400 text-sm">No. Pesanan</span>
          <span className="font-black text-gray-900 text-base">{orderNumber}</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onTrack}
          className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-base"
          style={{ background: PRIMARY, boxShadow: `0 8px 24px rgba(255,107,53,0.35)` }}
        >
          Lacak Pesanan
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ─── Checkout Page ─────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter()
  const [tableNumber, setTableNumber]   = useState('1')
  const { lang, t, isRTL }             = useLang()
  const { items, clearCart }            = useCart()

  const [customerName, setCustomerName]   = useState('')
  const [orderType, setOrderType]         = useState<OrderType>('dine_in')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [loading, setLoading]             = useState(false)
  const [submitted, setSubmitted]         = useState(false)
  const [error, setError]                 = useState('')
  const [successData, setSuccessData]     = useState<{ orderId: string; orderNumber: string } | null>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
  }, [])

  const total = calculateCartTotal(items)

  async function handleSubmit() {
    if (submitted || loading || !customerName.trim() || !items.length) return
    setSubmitted(true); setLoading(true); setError('')

    try {
      if (IS_MOCK_MODE) {
        await new Promise(r => setTimeout(r, 1200))
        clearCart()
        setSuccessData({ orderId: 'mock-preview-order', orderNumber: 'ORD-DEMO1' })
        setLoading(false)
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
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      clearCart()
      setSuccessData({ orderId: data.id, orderNumber: data.order_number ?? data.id.slice(0, 8).toUpperCase() })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'))
      setLoading(false); setSubmitted(false)
    }
  }

  // Show success screen
  if (successData) {
    return (
      <SuccessScreen
        orderNumber={successData.orderNumber}
        tableNumber={tableNumber}
        onTrack={() => router.push(`/order/${successData.orderId}?table=${tableNumber}`)}
      />
    )
  }

  return (
    <div className="min-h-dvh bg-[#FAFAFA] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100"
        style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()}
            className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-500">
            <ArrowLeft size={18} className={isRTL ? 'rotate-180' : ''} />
          </button>
          <h1 className="font-bold text-gray-900 text-base">{t('checkoutTitle')}</h1>
        </div>
      </header>

      <div className="flex-1 px-4 py-5 space-y-4 pb-36">

        {/* Table */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${PRIMARY}15` }}>
            <MapPin size={18} style={{ color: PRIMARY }} />
          </div>
          <div>
            <p className="text-gray-400 text-xs">{t('tableNumber')}</p>
            <p className="text-gray-900 font-bold">{tableNumber}</p>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            <User size={14} /> {t('yourName')} <span className="text-red-400">*</span>
          </label>
          <input
            type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
            placeholder={t('namePlaceholder')} required
            className="w-full px-4 py-3.5 text-sm bg-white border border-gray-200 rounded-2xl text-gray-900 outline-none placeholder:text-gray-300 focus:border-orange-300 transition-colors"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          />
        </div>

        {/* Order type */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-600">{t('orderType')}</p>
          <div className="grid grid-cols-2 gap-3">
            {ORDER_TYPES.map(({ value, icon: Icon, labelKey }) => (
              <motion.button key={value} whileTap={{ scale: 0.96 }}
                onClick={() => setOrderType(value)}
                className="relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all"
                style={{
                  background: orderType === value ? `${PRIMARY}08` : 'white',
                  borderColor: orderType === value ? PRIMARY : '#E5E7EB',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: orderType === value ? `${PRIMARY}15` : '#F9FAFB' }}>
                  <Icon size={20} style={{ color: orderType === value ? PRIMARY : '#9CA3AF' }} />
                </div>
                <span className="text-sm font-semibold"
                  style={{ color: orderType === value ? PRIMARY : '#6B7280' }}>
                  {t(labelKey)}
                </span>
                {orderType === value && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: PRIMARY }}>
                    <CheckCircle size={10} className="text-white" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-600">{t('paymentMethod')}</p>
          <div className="grid grid-cols-3 gap-2.5">
            {PAYMENT_METHODS.map(({ value, icon: Icon, labelKey }) => (
              <motion.button key={value} whileTap={{ scale: 0.96 }}
                onClick={() => setPaymentMethod(value)}
                className="relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all"
                style={{
                  background: paymentMethod === value ? `${PRIMARY}08` : 'white',
                  borderColor: paymentMethod === value ? PRIMARY : '#E5E7EB',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: paymentMethod === value ? `${PRIMARY}15` : '#F9FAFB' }}>
                  <Icon size={20} style={{ color: paymentMethod === value ? PRIMARY : '#9CA3AF' }} />
                </div>
                <span className="text-sm font-semibold"
                  style={{ color: paymentMethod === value ? PRIMARY : '#6B7280' }}>
                  {t(labelKey)}
                </span>
                {paymentMethod === value && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: PRIMARY }}>
                    <CheckCircle size={10} className="text-white" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h3 className="font-semibold text-gray-900 text-sm">{t('orderSummary')}</h3>
          <div className="space-y-2.5">
            {items.map(item => (
              <div key={item.id} className="flex justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-gray-600 text-sm">{getItemName(item, lang)} × {item.qty}</span>
                  {item.itemNotes && (
                    <p className="text-gray-400 text-[11px] italic mt-0.5">📝 {item.itemNotes}</p>
                  )}
                </div>
                <span className="text-gray-900 text-sm font-medium flex-shrink-0">
                  {formatPrice(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between font-bold">
            <span className="text-gray-900">{t('total')}</span>
            <span className="text-lg" style={{ color: PRIMARY }}>{formatPrice(total)}</span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm text-center">
            {error}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-white border-t border-gray-100">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading || submitted || !customerName.trim() || !items.length}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: PRIMARY, boxShadow: `0 8px 24px rgba(255,107,53,0.35)` }}
        >
          {loading
            ? <><span className="animate-spin text-lg">⟳</span> {t('processing')}</>
            : <><CheckCircle size={18} /> {t('placeOrder')}</>}
        </motion.button>
      </div>
    </div>
  )
}
