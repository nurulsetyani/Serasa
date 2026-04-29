'use client'

import { useEffect, useState, useCallback } from 'react'
import { Clock, ChefHat, CheckCircle, RefreshCw } from 'lucide-react'
import { Order, OrderStatus } from '@/types'
import { supabase } from '@/lib/supabase'
import { formatTime } from '@/lib/utils'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

function ElapsedTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const calc = () => Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
    setElapsed(calc())
    const id = setInterval(() => setElapsed(calc()), 10000)
    return () => clearInterval(id)
  }, [createdAt])

  const mins = Math.floor(elapsed / 60)
  const isLate = mins >= 20

  return (
    <span className={`flex items-center gap-1 font-mono font-bold text-sm ${isLate ? 'text-red-400 animate-pulse' : 'text-ink-muted'}`}>
      <Clock size={12} />
      {mins}m
    </span>
  )
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', RESTAURANT_ID)
      .in('status', ['pending', 'cooking'])
      .order('created_at', { ascending: true })

    if (data) setOrders(data as Order[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()

    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        if (payload.eventType === 'INSERT') {
          setNotification(`🆕 New order — Table ${(payload.new as Order).table_number}!`)
          setTimeout(() => setNotification(null), 4000)
          fetchOrders()
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Order
          if (updated.status === 'ready' || updated.status === 'delivered') {
            setOrders(prev => prev.filter(o => o.id !== updated.id))
          } else {
            setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
          }
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchOrders])

  async function startCooking(orderId: string) {
    setUpdating(orderId)
    await fetch(`/api/order/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cooking' }),
    })
    setUpdating(null)
  }

  async function markReady(orderId: string) {
    setUpdating(orderId)
    await fetch(`/api/order/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ready' }),
    })
    setUpdating(null)
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const cookingOrders = orders.filter(o => o.status === 'cooking')

  return (
    <div className="min-h-dvh bg-obsidian p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ChefHat size={28} className="text-gold" />
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Kitchen Display</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-ink-muted text-xs">Live — {orders.length} active orders</span>
            </div>
          </div>
        </div>
        <button onClick={fetchOrders} className="btn-ghost p-2 rounded-xl">
          <RefreshCw size={16} className={loading ? 'animate-spin text-gold' : 'text-ink-muted'} />
        </button>
      </div>

      {/* New order notification */}
      {notification && (
        <div className="mb-4 p-4 rounded-2xl bg-gold-muted border border-gold animate-slide-up flex items-center gap-3">
          <span className="text-2xl animate-bounce">🔔</span>
          <span className="text-gold font-bold">{notification}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton rounded-2xl h-64" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <CheckCircle size={64} className="text-green-400 mb-4 opacity-40" />
          <h2 className="font-display text-2xl font-bold text-ink mb-2">All Clear!</h2>
          <p className="text-ink-muted">No pending orders right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* PENDING orders */}
          {pendingOrders.map(order => (
            <div
              key={order.id}
              className="card-dark p-5 space-y-4 border-yellow-500/30 animate-fade-up"
            >
              {/* Card header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl font-display font-bold text-gold">Meja {order.table_number}</span>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-bold">⏳ NEW</span>
                  </div>
                  <p className="text-ink-muted text-sm">{order.customer_name}</p>
                </div>
                <ElapsedTimer createdAt={order.created_at} />
              </div>

              {/* Items */}
              <div className="bg-obsidian-surface rounded-xl p-4 space-y-2">
                {order.order_items?.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-gold font-bold text-xl w-8">{item.qty}×</span>
                    <span className="text-ink font-semibold">{item.name}</span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-yellow-300 text-sm">
                  ⚠️ {order.notes}
                </div>
              )}

              {/* Start cooking button */}
              <button
                onClick={() => startCooking(order.id)}
                disabled={updating === order.id}
                className="w-full py-4 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {updating === order.id ? '...' : '🔥 Start Cooking'}
              </button>
            </div>
          ))}

          {/* COOKING orders */}
          {cookingOrders.map(order => (
            <div
              key={order.id}
              className="card-dark p-5 space-y-4 border-red-500/30 animate-fade-up"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl font-display font-bold text-gold">Meja {order.table_number}</span>
                    <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold animate-pulse">🔥 COOKING</span>
                  </div>
                  <p className="text-ink-muted text-sm">{order.customer_name}</p>
                </div>
                <ElapsedTimer createdAt={order.created_at} />
              </div>

              <div className="bg-obsidian-surface rounded-xl p-4 space-y-2">
                {order.order_items?.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-gold font-bold text-xl w-8">{item.qty}×</span>
                    <span className="text-ink font-semibold">{item.name}</span>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-yellow-300 text-sm">
                  ⚠️ {order.notes}
                </div>
              )}

              <button
                onClick={() => markReady(order.id)}
                disabled={updating === order.id}
                className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {updating === order.id ? '...' : '✅ Mark Ready'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
