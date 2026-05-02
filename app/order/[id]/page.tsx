'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Home, Clock, ChefHat, CheckCircle, Package, Copy, MessageCircle, Printer } from 'lucide-react'
import { motion } from 'framer-motion'
import { Order, OrderStatus } from '@/types'
import { supabase } from '@/lib/supabase'
import { IS_MOCK_MODE } from '@/lib/mock-data'
import { useLang } from '@/context/LanguageContext'
import { formatPrice, getStatusStep, formatTime } from '@/lib/utils'
import ReviewModal from '@/components/ReviewModal'
import { TranslationKey } from '@/lib/i18n'

const PRIMARY = '#FF6B35'

const MOCK_ORDER: Order = {
  id: 'mock-preview-order',
  restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
  table_number: '5',
  customer_name: 'Preview User',
  status: 'cooking',
  total_price: 82,
  order_number: 'ORD-DEMO1',
  created_at: new Date().toISOString(),
  order_items: [
    { id: 'oi-1', order_id: 'mock-preview-order', menu_id: 'mock-1', name: 'Mie Goreng Ayam', price: 25, qty: 1 },
    { id: 'oi-2', order_id: 'mock-preview-order', menu_id: 'mock-5', name: 'Rendang Sapi', price: 35, qty: 1 },
    { id: 'oi-3', order_id: 'mock-preview-order', menu_id: 'mock-9', name: 'Es Cendol', price: 12, qty: 1 },
  ],
}

const STATUS_STEPS: { status: OrderStatus; icon: React.ElementType; labelKey: TranslationKey; descKey: TranslationKey }[] = [
  { status: 'pending',   icon: Clock,       labelKey: 'pending',   descKey: 'pendingDesc' },
  { status: 'cooking',   icon: ChefHat,     labelKey: 'cooking',   descKey: 'cookingDesc' },
  { status: 'ready',     icon: Package,     labelKey: 'ready',     descKey: 'readyDesc' },
  { status: 'delivered', icon: CheckCircle, labelKey: 'delivered', descKey: 'deliveredDesc' },
]

const PAY = {
  stcNumber: process.env.NEXT_PUBLIC_STC_PAY_NUMBER    ?? '05XXXXXXXX',
  bankName:  process.env.NEXT_PUBLIC_BANK_NAME         ?? 'Al Rajhi Bank',
  bankIban:  process.env.NEXT_PUBLIC_BANK_IBAN         ?? 'SA00 0000 0000 0000 0000 0000',
  bankOwner: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? 'Serasa Restaurant',
  adminWa:   process.env.NEXT_PUBLIC_ADMIN_WA          ?? '966500000000',
}

function PaymentInfo({ order }: { order: Order }) {
  const { t } = useLang()
  const [copied, setCopied] = useState<string | null>(null)

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const waText = encodeURIComponent(
    `Halo Serasa Restaurant, saya sudah bayar untuk pesanan ${order.order_number ?? order.id.slice(0, 8).toUpperCase()} — Meja ${order.table_number} — ${order.customer_name}`
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-2">
        <span className="text-xl">💳</span>
        <h2 className="text-gray-900 font-semibold text-sm">{t('paymentInfo')}</h2>
      </div>
      <p className="text-gray-400 text-xs leading-relaxed">{t('paymentInfoDesc')}</p>

      {/* STC Pay */}
      <div className="rounded-xl p-4" style={{ background: '#FFF3EE', border: `1px solid #FFD5C4` }}>
        <div className="flex items-center gap-2 mb-3">
          <span>📱</span>
          <span className="font-semibold text-sm" style={{ color: PRIMARY }}>STC Pay</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-gray-400 text-[11px]">{t('phoneNumber')}</p>
            <p className="text-gray-900 font-bold text-base tracking-wider">{PAY.stcNumber}</p>
          </div>
          <button onClick={() => copy(PAY.stcNumber, 'stc')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium active:scale-95 transition-transform text-white"
            style={{ background: PRIMARY }}>
            <Copy size={12} />
            {copied === 'stc' ? 'Tersalin!' : 'Salin'}
          </button>
        </div>
      </div>

      {/* Bank */}
      <div className="rounded-xl p-4 bg-gray-50 border border-gray-200 space-y-3">
        <div className="flex items-center gap-2">
          <span>🏦</span>
          <span className="text-gray-900 font-semibold text-sm">{PAY.bankName}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-gray-400 text-[11px]">{t('accountNumber')}</p>
            <p className="text-gray-900 font-mono text-sm truncate">{PAY.bankIban}</p>
          </div>
          <button onClick={() => copy(PAY.bankIban.replace(/\s/g, ''), 'iban')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-medium active:scale-95 flex-shrink-0">
            <Copy size={12} />
            {copied === 'iban' ? 'Tersalin!' : 'Salin'}
          </button>
        </div>
        <div>
          <p className="text-gray-400 text-[11px]">{t('accountName')}</p>
          <p className="text-gray-900 text-sm font-medium">{PAY.bankOwner}</p>
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-sm">{t('transferAmount')}</span>
        <span className="font-black text-xl" style={{ color: PRIMARY }}>{formatPrice(order.total_price)}</span>
      </div>

      {/* WA button */}
      <a href={`https://wa.me/${PAY.adminWa}?text=${waText}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-bold text-sm text-white"
        style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
        <MessageCircle size={18} />
        {t('sendProof')}
      </a>
    </div>
  )
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t, isRTL } = useLang()

  const [tableNumber, setTableNumber] = useState('1')
  const [order, setOrder]             = useState<Order | null>(null)
  const [loading, setLoading]         = useState(true)
  const [showReview, setShowReview]   = useState(false)
  const [reviewShown, setReviewShown] = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
  }, [])

  useEffect(() => {
    async function fetchOrder() {
      if (IS_MOCK_MODE || id === 'mock-preview-order') {
        setOrder({ ...MOCK_ORDER, table_number: new URLSearchParams(window.location.search).get('table') ?? '5' })
        setLoading(false)
        return
      }
      const res = await window.fetch(`/api/order/${id}`)
      if (res.ok) setOrder(await res.json())
      setLoading(false)
    }
    fetchOrder()

    if (IS_MOCK_MODE || id === 'mock-preview-order') return

    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        payload => setOrder(prev => prev ? { ...prev, ...payload.new } : null))
      .subscribe()

    const poll = setInterval(async () => {
      const res = await window.fetch(`/api/order/${id}`)
      if (res.ok) setOrder(await res.json())
    }, 5000)

    return () => { supabase.removeChannel(channel); clearInterval(poll) }
  }, [id])

  useEffect(() => {
    if (order?.status === 'delivered' && !reviewShown) {
      setTimeout(() => { setShowReview(true); setReviewShown(true) }, 1500)
    }
  }, [order?.status, reviewShown])

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-dvh bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────
  if (!order) {
    return (
      <div className="min-h-dvh bg-[#FAFAFA] flex flex-col items-center justify-center p-8 text-center">
        <p className="text-gray-400 mb-4">{t('error')}</p>
        <button onClick={() => router.push(`/menu?table=${tableNumber}`)}
          className="px-6 py-3 rounded-2xl text-white font-bold text-sm"
          style={{ background: PRIMARY }}>
          {t('backToMenu')}
        </button>
      </div>
    )
  }

  const currentStep = getStatusStep(order.status)

  return (
    <div className="min-h-dvh bg-[#FAFAFA] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100"
        style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="font-bold text-gray-900 text-base">{t('trackOrder')}</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {t('table')} {order.table_number} · {order.customer_name}
            </p>
          </div>
          {/* Status pill */}
          <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white"
            style={{
              background:
                order.status === 'pending'   ? '#F59E0B' :
                order.status === 'cooking'   ? PRIMARY :
                order.status === 'ready'     ? '#10B981' : '#6366F1',
            }}>
            {order.status === 'pending' ? `⏳ ${t('pending')}` :
             order.status === 'cooking' ? `🔥 ${t('cooking')}` :
             order.status === 'ready'   ? `✅ ${t('ready')}` : `✓ ${t('delivered')}`}
          </span>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 space-y-4 pb-28">

        {/* Order number */}
        {order.order_number && (
          <div className="flex items-center justify-between bg-white rounded-2xl px-5 py-3 border border-gray-100"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <span className="text-gray-400 text-sm">No. Pesanan</span>
            <span className="font-black text-gray-900">{order.order_number}</span>
          </div>
        )}

        {/* ── STATUS TIMELINE ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 className="text-gray-900 font-semibold text-sm mb-5">{t('orderStatus')}</h2>

          <div className="space-y-0">
            {STATUS_STEPS.map((step, idx) => {
              const isDone   = idx <= currentStep
              const isActive = idx === currentStep
              const Icon     = step.icon

              return (
                <div key={step.status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500"
                      style={{
                        borderColor: isDone ? PRIMARY : '#E5E7EB',
                        background:  isActive ? '#FFF3EE' : isDone ? PRIMARY : '#F9FAFB',
                      }}>
                      <Icon size={15}
                        style={{ color: isActive ? PRIMARY : isDone ? 'white' : '#D1D5DB' }} />
                    </motion.div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className="w-0.5 h-8 mt-1 transition-colors duration-500 rounded-full"
                        style={{ background: isDone && idx < currentStep ? PRIMARY : '#E5E7EB' }} />
                    )}
                  </div>

                  <div className={`pb-6 flex-1 pt-1.5 ${idx === STATUS_STEPS.length - 1 ? 'pb-0' : ''}`}>
                    <p className="font-semibold text-sm"
                      style={{ color: isActive ? PRIMARY : isDone ? '#1F2937' : '#9CA3AF' }}>
                      {t(step.labelKey)}
                    </p>
                    {isActive && (
                      <p className="text-gray-400 text-xs mt-0.5">{t(step.descKey)}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── ORDER ITEMS ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex justify-between items-center">
            <h2 className="text-gray-900 font-semibold text-sm">{t('orderItems')}</h2>
            <span className="text-gray-400 text-xs">{formatTime(order.created_at)}</span>
          </div>
          <div className="space-y-2.5">
            {order.order_items?.map(item => (
              <div key={item.id} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-600">{item.name} × {item.qty}</span>
                <span className="text-gray-900 font-medium">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="font-bold text-gray-900">{t('total')}</span>
            <span className="font-black text-xl" style={{ color: PRIMARY }}>
              {formatPrice(order.total_price)}
            </span>
          </div>
        </div>

        {/* Payment info — hanya transfer bank */}
        {order.payment_method === 'online' && (
          <PaymentInfo order={order} />
        )}

        {/* Download Struk */}
        <button
          onClick={() => window.open(`/receipt/${id}?download=1`, '_blank')}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ background: PRIMARY, boxShadow: `0 4px 16px rgba(255,107,53,0.3)` }}
        >
          <Printer size={15} />
          {t('downloadReceipt')}
        </button>

        {/* Live indicator */}
        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>{t('liveUpdate')}</span>
        </div>
      </main>

      {/* ── BOTTOM ACTION ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom bg-white border-t border-gray-100">
        <button
          onClick={() => router.push(`/menu?table=${tableNumber}`)}
          className="w-full py-3.5 rounded-2xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          style={{ borderColor: PRIMARY, color: PRIMARY }}
        >
          <Home size={16} />
          {t('backToMenu')}
        </button>
      </div>

      {showReview && <ReviewModal orderId={id} onClose={() => setShowReview(false)} />}
    </div>
  )
}
