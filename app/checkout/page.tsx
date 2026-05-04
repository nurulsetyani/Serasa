'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, UtensilsCrossed, ShoppingBag,
  Banknote, Smartphone, QrCode, CheckCircle, ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/context/CartContext'
import { useLang } from '@/context/LanguageContext'
import { formatPrice, calculateCartTotal } from '@/lib/utils'
import { getItemName } from '@/lib/i18n'
import { IS_MOCK_MODE } from '@/lib/mock-data'
import { OrderType, PaymentMethod } from '@/types'

const P = '#F0A030'   // primary orange

type OTOpt = { value: OrderType;    icon: React.ElementType; labelKey: 'dineIn' | 'takeAway' }
type PMOpt = { value: PaymentMethod; icon: React.ElementType; labelKey: 'cash' | 'online' | 'qris' }

const ORDER_TYPES: OTOpt[] = [
  { value: 'dine_in',   icon: UtensilsCrossed, labelKey: 'dineIn' },
  { value: 'take_away', icon: ShoppingBag,     labelKey: 'takeAway' },
]
const PAYMENT_METHODS: PMOpt[] = [
  { value: 'cash',   icon: Banknote,   labelKey: 'cash' },
  { value: 'online', icon: Smartphone, labelKey: 'online' },
  { value: 'qris',   icon: QrCode,     labelKey: 'qris' },
]

// ── Success Screen ─────────────────────────────────────────
function SuccessScreen({ orderNumber, tableNumber, lang, onTrack }: {
  orderNumber: string; tableNumber: string; lang: string; onTrack: () => void
}) {
  const { t } = useLang()
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-dvh bg-[#FAFAF8] flex flex-col items-center justify-center px-6 text-center"
    >
      {/* Animated check */}
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
        className="relative mb-6"
      >
        <div className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{ background: `${P}15` }}>
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.25 }}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: P }}>
            <CheckCircle size={40} className="text-white" strokeWidth={2} />
          </motion.div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }} className="space-y-2 mb-8">
        <h1 className="font-black text-gray-900 text-[28px] leading-tight"
          style={{ letterSpacing: '-0.02em' }}>
          {t('orderReceived')}
        </h1>
        <p className="text-gray-500 text-sm">{t('orderProcessing')}</p>
        <p className="text-gray-400 text-xs">{t('table')} #{tableNumber}</p>
      </motion.div>

      {/* Order number card */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.45 }}
        className="bg-white rounded-2xl px-6 py-4 mb-8 flex items-center gap-3"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: `1.5px solid ${P}30` }}>
        <div>
          <p className="text-[10px] font-black tracking-[2px] uppercase mb-1"
            style={{ color: '#9A8A7A' }}>{t('orderNumber')}</p>
          <p className="font-black text-2xl" style={{ color: '#1A1208' }}>{orderNumber}</p>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        whileTap={{ scale: 0.97 }} onClick={onTrack}
        className="w-full rounded-full py-[18px] text-white font-black text-[16px] flex items-center justify-center gap-2"
        style={{ background: P, boxShadow: `0 8px 24px rgba(240,160,48,0.4)`, letterSpacing: '0.02em' }}>
        {t('trackOrder')} <ChevronRight size={18} strokeWidth={3} />
      </motion.button>
    </motion.div>
  )
}

// ── Checkout Page ──────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter()
  const { lang, t, isRTL } = useLang()
  const { items, clearCart } = useCart()

  const [table, setTable]               = useState('1')
  const [name, setName]                 = useState('')
  const [orderType, setOrderType]       = useState<OrderType>('dine_in')
  const [payment, setPayment]           = useState<PaymentMethod>('cash')
  const [loading, setLoading]           = useState(false)
  const [submitted, setSubmitted]       = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState<{ orderId: string; orderNumber: string } | null>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTable(p.get('table') ?? '1')
  }, [])

  const total = calculateCartTotal(items)

  async function handleSubmit() {
    if (submitted || loading || !name.trim() || !items.length) return
    setSubmitted(true); setLoading(true); setError('')
    try {
      if (IS_MOCK_MODE) {
        await new Promise(r => setTimeout(r, 1100))
        clearCart()
        setSuccess({ orderId: 'mock-preview-order', orderNumber: 'SV-DEMO1' })
        setLoading(false); return
      }
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(), table_number: table,
          order_type: orderType, payment_method: payment, total_price: total,
          items: items.map(i => ({ menu_id: i.id, name: getItemName(i, 'en'), price: i.price, qty: i.qty, notes: i.itemNotes ?? null })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      clearCart()
      setSuccess({ orderId: data.id, orderNumber: data.order_number ?? `SV-${data.id.slice(0,6).toUpperCase()}` })
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error'))
      setLoading(false); setSubmitted(false)
    }
  }

  if (success) {
    return (
      <SuccessScreen
        orderNumber={success.orderNumber} tableNumber={table} lang={lang}
        onTrack={() => router.push(`/order/${success.orderId}?table=${table}`)}
      />
    )
  }

  return (
    <div className="min-h-dvh bg-[#FAFAF8] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <ArrowLeft size={17} className={`text-gray-600 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <h1 className="font-black text-gray-900 text-base">{t('checkoutTitle')}</h1>
        </div>
      </header>

      <div className="flex-1 px-4 py-5 space-y-3 pb-36">

        {/* Table card */}
        <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F0EAE0' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${P}15` }}>
            <span className="text-lg">🪑</span>
          </div>
          <div>
            <p className="text-[10px] font-black tracking-[2px] uppercase mb-0.5" style={{ color: '#9A8A7A' }}>
              {t('tableNumber')}
            </p>
            <p className="font-black text-gray-900 text-base">#{table}</p>
          </div>
        </div>

        {/* Name */}
        <div className="bg-white rounded-2xl px-5 py-4"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F0EAE0' }}>
          <p className="text-[10px] font-black tracking-[2px] uppercase mb-3" style={{ color: '#9A8A7A' }}>
            {t('yourName')} <span style={{ color: P }}>*</span>
          </p>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            className="w-full text-base font-semibold text-gray-900 outline-none bg-transparent placeholder:text-gray-300 placeholder:font-normal"
          />
          <div className="h-px mt-3" style={{ background: name ? P : '#E8E0D8', transition: 'background 0.2s' }} />
        </div>

        {/* Order type */}
        <div className="bg-white rounded-2xl px-5 py-4"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F0EAE0' }}>
          <p className="text-[10px] font-black tracking-[2px] uppercase mb-3" style={{ color: '#9A8A7A' }}>
            {t('orderType')}
          </p>
          <div className="flex gap-2 p-1 bg-gray-100 rounded-full">
            {ORDER_TYPES.map(({ value, icon: Icon, labelKey }) => (
              <motion.button key={value} whileTap={{ scale: 0.95 }}
                onClick={() => setOrderType(value)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-black transition-all"
                style={{
                  background: orderType === value ? P : 'transparent',
                  color: orderType === value ? 'white' : '#9A8A7A',
                  boxShadow: orderType === value ? `0 4px 12px rgba(240,160,48,0.35)` : 'none',
                }}>
                <Icon size={14} />
                {t(labelKey)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl px-5 py-4"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F0EAE0' }}>
          <p className="text-[10px] font-black tracking-[2px] uppercase mb-3" style={{ color: '#9A8A7A' }}>
            {t('paymentMethod')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(({ value, icon: Icon, labelKey }) => {
              const active = payment === value
              return (
                <motion.button key={value} whileTap={{ scale: 0.94 }}
                  onClick={() => setPayment(value)}
                  className="relative flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all"
                  style={{
                    background: active ? `${P}10` : '#FAFAF8',
                    borderColor: active ? P : '#EEEAE4',
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: active ? `${P}20` : '#F0EAE4' }}>
                    <Icon size={18} style={{ color: active ? P : '#A09080' }} />
                  </div>
                  <span className="text-[11px] font-black" style={{ color: active ? P : '#9A8A7A' }}>
                    {t(labelKey)}
                  </span>
                  {active && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: P }}>
                      <span className="text-white text-[8px] font-black">✓</span>
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl px-5 py-4"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F0EAE0' }}>
          <p className="text-[10px] font-black tracking-[2px] uppercase mb-3" style={{ color: '#9A8A7A' }}>
            {t('orderSummary')}
          </p>
          <div className="space-y-2.5 mb-3">
            {items.map(item => (
              <div key={item.id} className="flex justify-between gap-2">
                <span className="text-gray-600 text-sm flex-1 min-w-0 line-clamp-1">
                  {getItemName(item, lang)} × {item.qty}
                </span>
                <span className="text-gray-900 font-bold text-sm flex-shrink-0">
                  {formatPrice(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <span className="font-black text-gray-900">{t('total')}</span>
            <span className="font-black text-xl" style={{ color: P }}>{formatPrice(total)}</span>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-500 text-sm text-center">
            {error}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 safe-bottom bg-[#FAFAF8] pt-3"
        style={{ boxShadow: '0 -8px 24px rgba(0,0,0,0.04)' }}>
        <motion.button
          whileTap={{ scale: 0.97 }} onClick={handleSubmit}
          disabled={loading || submitted || !name.trim() || !items.length}
          className="w-full py-[18px] rounded-full text-white font-black text-[16px] flex items-center justify-center gap-2 disabled:opacity-40"
          style={{
            background: P,
            boxShadow: `0 8px 28px rgba(240,160,48,0.42)`,
            letterSpacing: '0.03em',
          }}>
          {loading
            ? <><span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t('processing')}</>
            : <>{t('placeOrder')} · {formatPrice(total)}</>
          }
        </motion.button>
      </div>
    </div>
  )
}
