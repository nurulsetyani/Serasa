'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Home, Clock, ChefHat, CheckCircle, Package } from 'lucide-react'
import { Order, OrderStatus } from '@/types'
import { supabase } from '@/lib/supabase'
import { IS_MOCK_MODE } from '@/lib/mock-data'
import { useLang } from '@/context/LanguageContext'
import { formatPrice, getStatusStep, formatTime } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import ReviewModal from '@/components/ReviewModal'
import { TranslationKey } from '@/lib/i18n'

const MOCK_ORDER: Order = {
  id: 'mock-preview-order',
  restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
  table_number: '5',
  customer_name: 'Preview User',
  status: 'cooking',
  total_price: 82,
  created_at: new Date().toISOString(),
  order_items: [
    { id: 'oi-1', order_id: 'mock-preview-order', menu_id: 'mock-1', name: 'Mie Goreng Ayam', price: 25, qty: 1 },
    { id: 'oi-2', order_id: 'mock-preview-order', menu_id: 'mock-5', name: 'Rendang Sapi', price: 35, qty: 1 },
    { id: 'oi-3', order_id: 'mock-preview-order', menu_id: 'mock-9', name: 'Es Cendol', price: 12, qty: 1 },
  ],
}

const STATUS_STEPS: { status: OrderStatus; icon: React.ElementType; descKey: TranslationKey }[] = [
  { status: 'pending',   icon: Clock,        descKey: 'pendingDesc' },
  { status: 'cooking',   icon: ChefHat,      descKey: 'cookingDesc' },
  { status: 'ready',     icon: Package,      descKey: 'readyDesc' },
  { status: 'delivered', icon: CheckCircle,  descKey: 'deliveredDesc' },
]

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t, isRTL } = useLang()

  const [tableNumber, setTableNumber] = useState('1')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReview, setShowReview] = useState(false)
  const [reviewShown, setReviewShown] = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
  }, [])

  useEffect(() => {
    async function fetchOrder() {
      // Mock mode: show a fake order for preview
      if (IS_MOCK_MODE || id === 'mock-preview-order') {
        setOrder({ ...MOCK_ORDER, table_number: new URLSearchParams(window.location.search).get('table') ?? '5' })
        setLoading(false)
        return
      }

      const res = await fetch(`/api/order/${id}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
      }
      setLoading(false)
    }
    fetchOrder()

    if (IS_MOCK_MODE || id === 'mock-preview-order') return

    // Realtime subscription
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        payload => {
          setOrder(prev => prev ? { ...prev, ...payload.new } : null)
        }
      )
      .subscribe()

    // Polling fallback every 5s (in case realtime not enabled)
    const poll = setInterval(async () => {
      const res = await fetch(`/api/order/${id}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
      }
    }, 5000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [id])

  // Trigger review modal on delivery
  useEffect(() => {
    if (order?.status === 'delivered' && !reviewShown) {
      setTimeout(() => {
        setShowReview(true)
        setReviewShown(true)
      }, 1500)
    }
  }, [order?.status, reviewShown])

  if (loading) {
    return (
      <div className="min-h-dvh bg-obsidian flex items-center justify-center">
        <div className="animate-spin text-gold text-4xl">⟳</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-dvh bg-obsidian flex flex-col items-center justify-center p-8 text-center">
        <p className="text-ink-muted mb-4">{t('error')}</p>
        <button onClick={() => router.push(`/menu?table=${tableNumber}`)} className="btn-gold px-6 py-3">
          {t('backToMenu')}
        </button>
      </div>
    )
  }

  const currentStep = getStatusStep(order.status)

  return (
    <div className="min-h-dvh bg-obsidian flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Decorative */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/5 rounded-full blur-[120px]" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-obsidian/90 backdrop-blur-xl border-b border-gold-border safe-top">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="font-display text-xl font-bold text-ink">{t('trackOrder')}</h1>
            <p className="text-ink-muted text-xs">{t('table')} {order.table_number} · {order.customer_name}</p>
          </div>
          <StatusBadge status={order.status} size="sm" />
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-6 pb-24">
        {/* Status Timeline */}
        <div className="card-dark p-5">
          <h2 className="text-ink font-semibold text-sm mb-5">{t('orderStatus')}</h2>
          <div className="space-y-0">
            {STATUS_STEPS.map((step, idx) => {
              const isDone = idx <= currentStep
              const isActive = idx === currentStep
              const Icon = step.icon

              return (
                <div key={step.status} className="flex gap-4">
                  {/* Line + Icon */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      isActive
                        ? 'border-gold bg-gold-muted shadow-gold-sm animate-pulse-gold'
                        : isDone
                          ? 'border-gold bg-gold text-obsidian'
                          : 'border-ink-faint bg-obsidian-surface'
                    }`}>
                      <Icon size={14} className={isDone ? (isActive ? 'text-gold' : 'text-obsidian') : 'text-ink-faint'} />
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 transition-colors duration-500 ${isDone && idx < currentStep ? 'bg-gold' : 'bg-ink-faint/20'}`} />
                    )}
                  </div>

                  {/* Text */}
                  <div className={`pb-6 flex-1 ${idx === STATUS_STEPS.length - 1 ? 'pb-0' : ''}`}>
                    <p className={`font-semibold text-sm ${isActive ? 'text-gold' : isDone ? 'text-ink' : 'text-ink-faint'}`}>
                      {t(step.status)}
                    </p>
                    {isActive && (
                      <p className="text-ink-muted text-xs mt-0.5 animate-fade-in">{t(step.descKey)}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order info */}
        <div className="card-dark p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-ink font-semibold text-sm">{t('orderItems')}</h2>
            <span className="text-xs text-ink-muted">{formatTime(order.created_at)}</span>
          </div>
          <div className="space-y-2">
            {order.order_items?.map(item => (
              <div key={item.id} className="flex justify-between text-sm py-2 border-b border-white/5 last:border-0">
                <span className="text-ink-muted">{item.name} × {item.qty}</span>
                <span className="text-ink">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-1 border-t border-gold-border">
            <span className="font-bold text-ink">{t('total')}</span>
            <span className="font-bold text-gold text-lg">{formatPrice(order.total_price)}</span>
          </div>
        </div>

        {/* Realtime indicator */}
        <div className="flex items-center justify-center gap-2 text-ink-muted text-xs">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>Live updates enabled</span>
        </div>
      </main>

      {/* Bottom action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom">
        <button
          onClick={() => router.push(`/menu?table=${tableNumber}`)}
          className="btn-ghost w-full py-3.5 flex items-center justify-center gap-2"
        >
          <Home size={16} />
          {t('backToMenu')}
        </button>
      </div>

      {showReview && (
        <ReviewModal orderId={id} onClose={() => setShowReview(false)} />
      )}
    </div>
  )
}
