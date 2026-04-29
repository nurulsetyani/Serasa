'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, ChevronDown } from 'lucide-react'
import { Order, OrderStatus } from '@/types'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/context/LanguageContext'
import { formatPrice, formatTime } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

const STATUS_FILTERS: { value: string; label: string; color: string }[] = [
  { value: 'all',       label: 'All',       color: 'border-ink-muted text-ink-muted' },
  { value: 'pending',   label: 'Pending',   color: 'border-yellow-500 text-yellow-400' },
  { value: 'cooking',   label: 'Cooking',   color: 'border-red-500 text-red-400' },
  { value: 'ready',     label: 'Ready',     color: 'border-green-500 text-green-400' },
  { value: 'delivered', label: 'Delivered', color: 'border-purple-500 text-purple-400' },
]

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending: 'cooking',
  cooking: 'ready',
  ready: 'delivered',
  delivered: null,
}

const STATUS_BUTTON: Record<OrderStatus, { label: string; class: string }> = {
  pending:   { label: '🔥 Start Cooking', class: 'bg-red-500/90 hover:bg-red-500 text-white' },
  cooking:   { label: '✅ Mark Ready',    class: 'bg-green-500/90 hover:bg-green-500 text-white' },
  ready:     { label: '🎉 Mark Delivered', class: 'bg-purple-500/90 hover:bg-purple-500 text-white' },
  delivered: { label: '',                  class: '' },
}

export default function AdminPage() {
  const { t, isRTL } = useLang()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [newOrderId, setNewOrderId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('created_at', { ascending: false })
      .limit(100)

    if (data) setOrders(data as Order[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        if (payload.eventType === 'INSERT') {
          setNewOrderId((payload.new as Order).id)
          setTimeout(() => setNewOrderId(null), 5000)
          fetchOrders()
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === (payload.new as Order).id ? { ...o, ...payload.new } : o))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchOrders])

  async function updateStatus(orderId: string, currentStatus: OrderStatus) {
    const nextStatus = NEXT_STATUS[currentStatus]
    if (!nextStatus) return

    setUpdating(orderId)
    await fetch(`/api/order/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    setUpdating(null)
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    cooking: orders.filter(o => o.status === 'cooking').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  return (
    <div className="min-h-dvh bg-obsidian" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-obsidian/95 backdrop-blur-xl border-b border-gold-border">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold-border flex items-center justify-center">
              <span className="text-gold text-sm">🌿</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-ink">Admin Dashboard</h1>
              <p className="text-ink-muted text-xs">Serasa Restaurant</p>
            </div>
          </div>
          <button onClick={fetchOrders} className="btn-ghost p-2 rounded-xl" title="Refresh">
            <RefreshCw size={16} className={loading ? 'animate-spin text-gold' : 'text-ink-muted'} />
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 px-4 md:px-6 pb-4 overflow-x-auto">
          {STATUS_FILTERS.map(sf => (
            <button
              key={sf.value}
              onClick={() => setFilter(sf.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${
                filter === sf.value
                  ? 'bg-gold text-obsidian border-gold'
                  : `bg-obsidian-light ${sf.color} hover:bg-obsidian-surface`
              }`}
            >
              {sf.label}
              <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold ${
                filter === sf.value ? 'bg-obsidian/20' : 'bg-obsidian-surface'
              }`}>
                {counts[sf.value as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* New order notification */}
      {newOrderId && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-gold-muted border border-gold-border flex items-center gap-2 animate-fade-in">
          <span className="animate-spin">⟳</span>
          <span className="text-gold font-semibold text-sm">🆕 New order incoming!</span>
        </div>
      )}

      {/* Orders grid */}
      <main className="px-4 md:px-6 py-4 pb-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton rounded-2xl h-48" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">📋</span>
            <p className="text-ink-muted">{t('noOrders')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(order => {
              const btn = STATUS_BUTTON[order.status]
              const next = NEXT_STATUS[order.status]
              const isNew = order.id === newOrderId

              return (
                <div
                  key={order.id}
                  className={`card-dark p-4 space-y-3 transition-all ${isNew ? 'border-gold/50 shadow-gold-md animate-pulse-gold' : ''}`}
                >
                  {/* Order header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-gold font-bold text-lg">Meja {order.table_number}</span>
                        {isNew && <span className="text-[10px] bg-gold text-obsidian px-2 py-0.5 rounded-full font-bold">NEW</span>}
                      </div>
                      <p className="text-ink-muted text-xs">{order.customer_name} · {formatTime(order.created_at)}</p>
                    </div>
                    <StatusBadge status={order.status} size="sm" />
                  </div>

                  {/* Items */}
                  <div className="bg-obsidian-surface rounded-xl p-3 space-y-1.5">
                    {order.order_items?.map(item => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span className="text-ink-muted">{item.qty}× {item.name}</span>
                        <span className="text-ink">{formatPrice(item.price * item.qty)}</span>
                      </div>
                    ))}
                    <div className="border-t border-white/5 pt-1.5 flex justify-between font-bold text-sm">
                      <span className="text-ink">{t('total')}</span>
                      <span className="text-gold">{formatPrice(order.total_price)}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <p className="text-xs text-ink-muted bg-obsidian-surface rounded-lg p-2">
                      📝 {order.notes}
                    </p>
                  )}

                  {/* Action button */}
                  {next && btn.label && (
                    <button
                      onClick={() => updateStatus(order.id, order.status)}
                      disabled={updating === order.id}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${btn.class} disabled:opacity-50`}
                    >
                      {updating === order.id ? '...' : btn.label}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
