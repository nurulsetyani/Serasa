'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Clock, ChefHat, Package, CheckCircle, Copy, Printer, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Order, OrderStatus } from '@/types'
import { supabase } from '@/lib/supabase'
import { IS_MOCK_MODE } from '@/lib/mock-data'
import { useLang } from '@/context/LanguageContext'
import { formatPrice, getStatusStep } from '@/lib/utils'
import ReviewModal from '@/components/ReviewModal'
import { TranslationKey } from '@/lib/i18n'

const PRIMARY = '#F0A030'

const MOCK_ORDER: Order = {
  id: 'mock-preview-order',
  restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
  table_number: '5', customer_name: 'Preview',
  status: 'cooking', total_price: 82,
  order_number: 'SV-930686',
  created_at: new Date().toISOString(),
  order_items: [
    { id: 'oi-1', order_id: 'mock-preview-order', menu_id: 'm1', name: 'Mie Goreng Ayam', price: 25, qty: 2 },
    { id: 'oi-2', order_id: 'mock-preview-order', menu_id: 'm9', name: 'Es Cendol', price: 12, qty: 1 },
  ],
}

// Cook times from menu (approximate)
const EST_MINS: Record<OrderStatus, number> = {
  pending: 20, cooking: 12, ready: 0, delivered: 0,
}

const STEPS: { status: OrderStatus; labelKey: TranslationKey; icon: React.ElementType }[] = [
  { status: 'pending',   labelKey: 'pending',   icon: CheckCircle },
  { status: 'cooking',   labelKey: 'cooking',   icon: ChefHat },
  { status: 'ready',     labelKey: 'ready',     icon: Package },
]

const PAY = {
  stcNumber: process.env.NEXT_PUBLIC_STC_PAY_NUMBER    ?? '05XXXXXXXX',
  bankName:  process.env.NEXT_PUBLIC_BANK_NAME         ?? 'Al Rajhi Bank',
  bankIban:  process.env.NEXT_PUBLIC_BANK_IBAN         ?? 'SA00 0000 0000 0000 0000 0000',
  bankOwner: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? 'Serasa Restaurant',
  adminWa:   process.env.NEXT_PUBLIC_ADMIN_WA          ?? '966500000000',
}

function PaymentCard({ order }: { order: Order }) {
  const { t } = useLang()
  const [copied, setCopied] = useState<string | null>(null)
  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000) })
  }
  const waText = encodeURIComponent(`Halo Serasa, saya sudah transfer untuk ${order.order_number ?? order.id.slice(0,8)} - Meja ${order.table_number}`)

  return (
    <div className="bg-white rounded-2xl p-5 space-y-4"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #F0EAE0' }}>
      <p className="font-black text-gray-900 text-sm">{t('paymentInfo')}</p>
      <p className="text-gray-400 text-xs">{t('paymentInfoDesc')}</p>

      {/* STC Pay */}
      <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: '#FFF8EE' }}>
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: '#9A8A7A' }}>STC Pay</p>
          <p className="font-black text-gray-900 text-base tracking-wider">{PAY.stcNumber}</p>
        </div>
        <button onClick={() => copy(PAY.stcNumber, 'stc')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold"
          style={{ background: PRIMARY }}>
          <Copy size={12} /> {copied === 'stc' ? '✓' : t('accountNumber').slice(0,5)}
        </button>
      </div>

      {/* Bank */}
      <div className="rounded-xl p-4 space-y-2 bg-gray-50">
        <p className="text-xs font-bold text-gray-500">{PAY.bankName}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400">{t('accountNumber')}</p>
            <p className="font-mono font-bold text-sm text-gray-900">{PAY.bankIban}</p>
          </div>
          <button onClick={() => copy(PAY.bankIban.replace(/\s/g,''), 'iban')}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500">
            <Copy size={12} />
          </button>
        </div>
        <p className="text-[11px] text-gray-400">{t('accountName')}: <strong className="text-gray-700">{PAY.bankOwner}</strong></p>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-gray-500 text-sm">{t('transferAmount')}</span>
        <span className="font-black text-xl" style={{ color: PRIMARY }}>{formatPrice(order.total_price)}</span>
      </div>

      <a href={`https://wa.me/${PAY.adminWa}?text=${waText}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-white font-bold text-sm"
        style={{ background: '#25D366' }}>
        <MessageCircle size={16} /> {t('sendProof')}
      </a>
    </div>
  )
}

export default function OrderTrackingPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const { t, isRTL } = useLang()

  const [table, setTable]           = useState('1')
  const [order, setOrder]           = useState<Order | null>(null)
  const [loading, setLoading]       = useState(true)
  const [showReview, setShowReview] = useState(false)
  const [reviewShown, setReviewShown] = useState(false)
  const [copied, setCopied]         = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTable(p.get('table') ?? '1')
  }, [])

  useEffect(() => {
    async function fetchOrder() {
      if (IS_MOCK_MODE || id === 'mock-preview-order') {
        setOrder({ ...MOCK_ORDER, table_number: new URLSearchParams(window.location.search).get('table') ?? '5' })
        setLoading(false); return
      }
      const res = await window.fetch(`/api/order/${id}`)
      if (res.ok) setOrder(await res.json())
      setLoading(false)
    }
    fetchOrder()

    if (IS_MOCK_MODE || id === 'mock-preview-order') return

    const channel = supabase.channel(`order-${id}`)
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

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin"
          style={{ borderTopColor: PRIMARY }} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-dvh bg-[#FAFAF8] flex flex-col items-center justify-center p-8 text-center">
        <p className="text-gray-400 mb-4">{t('error')}</p>
        <button onClick={() => router.push(`/menu?table=${table}`)}
          className="px-6 py-3 rounded-full text-white font-bold"
          style={{ background: PRIMARY }}>{t('backToMenu')}</button>
      </div>
    )
  }

  const currentStep = getStatusStep(order.status)
  const estMins = EST_MINS[order.status]

  return (
    <div className="min-h-dvh bg-[#FAFAF8] pb-10" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── TOP CONTENT ── */}
      <div className="px-6 pt-12 pb-6 text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: `${PRIMARY}18` }}
        >
          <span className="text-3xl">🍛</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-black text-gray-900 mb-1"
          style={{ fontSize: 'clamp(26px, 8vw, 32px)', letterSpacing: '-0.025em' }}
        >
          {t('orderReceived')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="text-gray-500 text-sm leading-relaxed"
        >
          {t('orderProcessing')}
        </motion.p>
      </div>

      <div className="px-5 space-y-4">

        {/* ORDER ID + TABLE card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #F0EAE0' }}
        >
          <div className="flex">
            <div className="flex-1 p-5">
              <p className="text-[10px] font-black tracking-[2px] text-gray-400 uppercase mb-2">
                {t('orderNumber')}
              </p>
              <div className="flex items-center gap-2">
                <span className="font-black text-gray-900 text-xl tracking-tight">
                  {order.order_number ?? order.id.slice(0, 10).toUpperCase()}
                </span>
                <button onClick={() => {
                  navigator.clipboard.writeText(order.order_number ?? order.id)
                  setCopied(true); setTimeout(() => setCopied(false), 1500)
                }}>
                  <Copy size={14} style={{ color: copied ? '#22C55E' : '#C0B8B0' }} />
                </button>
              </div>
            </div>
            <div className="w-px bg-gray-100 my-4" />
            <div className="p-5 text-right">
              <p className="text-[10px] font-black tracking-[2px] text-gray-400 uppercase mb-2">
                TABLE
              </p>
              <span className="font-black text-gray-900 text-xl">#{order.table_number}</span>
            </div>
          </div>
        </motion.div>

        {/* ESTIMATED TIME */}
        {estMins > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-5 flex items-center gap-4"
            style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #F0EAE0' }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${PRIMARY}15` }}>
              <Clock size={26} style={{ color: PRIMARY }} />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-[2px] text-gray-400 uppercase mb-1">
                ESTIMATED TIME
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-black text-3xl" style={{ color: PRIMARY }}>{estMins}</span>
                <span className="font-bold text-gray-500 text-sm">mins</span>
                <span className="text-[10px] font-black tracking-[2px] text-gray-400 uppercase">READY</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* HORIZONTAL PROGRESS STEPPER */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #F0EAE0' }}
        >
          <div className="flex items-start">
            {STEPS.map((step, idx) => {
              const Icon = step.icon
              const done = idx <= currentStep
              const isLast = idx === STEPS.length - 1
              return (
                <div key={step.status} className="flex-1 flex flex-col items-center">
                  <div className="flex items-center w-full">
                    {/* Left connector */}
                    {idx > 0 && (
                      <div className="flex-1 h-0.5 mb-1"
                        style={{ background: idx <= currentStep ? PRIMARY : '#E8E0D8' }} />
                    )}
                    {/* Circle */}
                    <motion.div
                      animate={done ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 0.4 }}
                      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: done ? PRIMARY : '#F0EAE4',
                        boxShadow: done ? `0 4px 14px rgba(240,160,48,0.35)` : 'none',
                      }}
                    >
                      {done
                        ? <CheckCircle size={20} className="text-white" strokeWidth={2.5} />
                        : <Icon size={18} style={{ color: '#C0B0A0' }} />
                      }
                    </motion.div>
                    {/* Right connector */}
                    {!isLast && (
                      <div className="flex-1 h-0.5 mb-1"
                        style={{ background: idx < currentStep ? PRIMARY : '#E8E0D8' }} />
                    )}
                  </div>
                  <p className="text-[10px] font-black tracking-[1px] uppercase mt-2 text-center"
                    style={{ color: done ? PRIMARY : '#C0B0A0' }}>
                    {t(step.labelKey)}
                  </p>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Order items */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="bg-white rounded-2xl p-5 space-y-3"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #F0EAE0' }}
        >
          <p className="text-[10px] font-black tracking-[2px] text-gray-400 uppercase">{t('orderItems')}</p>
          {order.order_items?.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.name} × {item.qty}</span>
              <span className="font-bold text-gray-900">{formatPrice(item.price * item.qty)}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <span className="font-bold text-gray-900">{t('total')}</span>
            <span className="font-black text-xl" style={{ color: PRIMARY }}>{formatPrice(order.total_price)}</span>
          </div>
        </motion.div>

        {/* Payment info for transfer/qris */}
        {order.payment_method === 'online' && <PaymentCard order={order} />}

        {/* Download struk */}
        <button onClick={() => window.open(`/receipt/${id}?download=1`, '_blank')}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold border-2 transition-all"
          style={{ borderColor: '#E8E0D8', color: '#9A8A7A' }}>
          <Printer size={15} />
          {t('downloadReceipt')}
        </button>

        {/* Live indicator */}
        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>{t('liveUpdate')}</span>
        </div>
      </div>

      {/* ── BOTTOM ACTIONS ── */}
      <div className="px-5 mt-6 space-y-3">
        {/* ORDER AGAIN */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push(`/menu?table=${table}`)}
          className="w-full py-[18px] rounded-full text-white font-black text-[15px] tracking-wider flex items-center justify-center gap-2"
          style={{
            background: PRIMARY,
            boxShadow: `0 8px 28px rgba(240,160,48,0.4)`,
            letterSpacing: '0.05em',
          }}
        >
          ORDER AGAIN <span className="text-lg">→</span>
        </motion.button>

        {/* Back to menu */}
        <button onClick={() => router.push(`/menu?table=${table}`)}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold"
          style={{ color: '#9A8A7A' }}>
          <span className="text-base">🍴</span>
          <span className="tracking-[2px] uppercase text-[11px]">{t('backToMenu')}</span>
        </button>
      </div>

      {showReview && <ReviewModal orderId={id} onClose={() => setShowReview(false)} />}
    </div>
  )
}
