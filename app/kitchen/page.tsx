'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Clock, ChefHat, CheckCircle, RefreshCw, Volume2, VolumeX } from 'lucide-react'
import { Order, OrderStatus } from '@/types'
import { supabase } from '@/lib/supabase'
import { IS_MOCK_MODE } from '@/lib/mock-data'
import { formatTime } from '@/lib/utils'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

const MOCK_ORDERS: Order[] = [
  {
    id: 'demo-1', restaurant_id: RESTAURANT_ID, table_number: '3',
    customer_name: 'Ahmad', status: 'pending', total_price: 60,
    order_number: 'ORD-ABC123',
    created_at: new Date().toISOString(),
    order_items: [
      { id: 'i1', order_id: 'demo-1', menu_id: 'm1', name: 'Mie Goreng Ayam', price: 25, qty: 1 },
      { id: 'i2', order_id: 'demo-1', menu_id: 'm5', name: 'Rendang Sapi', price: 35, qty: 1 },
    ],
  },
  {
    id: 'demo-2', restaurant_id: RESTAURANT_ID, table_number: '5',
    customer_name: 'Fatimah', status: 'cooking', total_price: 50,
    order_number: 'ORD-XYZ789',
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
    order_items: [
      { id: 'i3', order_id: 'demo-2', menu_id: 'm3', name: 'Nasi Goreng Spesial', price: 22, qty: 2 },
      { id: 'i4', order_id: 'demo-2', menu_id: 'm9', name: 'Es Cendol', price: 12, qty: 2 },
    ],
  },
]

function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const times = [0, 0.18, 0.36]
    times.forEach((t, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(i === 0 ? 880 : i === 1 ? 1100 : 880, ctx.currentTime + t)
      gain.gain.setValueAtTime(0.35, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.16)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.16)
    })
  } catch {}
}

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
    <span className={`flex items-center gap-1 font-mono font-bold text-sm ${isLate ? 'text-red-400 animate-pulse' : 'text-[#777]'}`}>
      <Clock size={12} />
      {mins}m
    </span>
  )
}

const STATUS_CONFIG: Record<'pending' | 'cooking', {
  badge: string; btnLabel: string; btnBg: string
}> = {
  pending: {
    badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    btnLabel: '🔥 Mulai Masak',
    btnBg: 'bg-red-500 hover:bg-red-400',
  },
  cooking: {
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    btnLabel: '✅ Tandai Siap',
    btnBg: 'bg-green-500 hover:bg-green-400',
  },
}

export default function KitchenPage() {
  const [orders, setOrders]         = useState<Order[]>([])
  const [loading, setLoading]       = useState(true)
  const [updating, setUpdating]     = useState<string | null>(null)
  const [newOrderMsg, setNewOrderMsg] = useState<string | null>(null)
  const [soundOn, setSoundOn]       = useState(true)
  const soundOnRef = useRef(true)

  useEffect(() => { soundOnRef.current = soundOn }, [soundOn])

  const fetchOrders = useCallback(async () => {
    if (IS_MOCK_MODE) { setOrders(MOCK_ORDERS); setLoading(false); return }
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
      .channel('kitchen-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        if (payload.eventType === 'INSERT') {
          const o = payload.new as Order
          if (soundOnRef.current) playNotificationSound()
          setNewOrderMsg(`🆕 Pesanan Baru — Meja ${o.table_number}`)
          setTimeout(() => setNewOrderMsg(null), 5000)
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

  async function updateStatus(orderId: string, next: OrderStatus) {
    setUpdating(orderId)
    await fetch(`/api/order/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    setUpdating(null)
  }

  const pending = orders.filter(o => o.status === 'pending')
  const cooking = orders.filter(o => o.status === 'cooking')

  return (
    <div className="min-h-dvh bg-[#0A0C0F] p-4 md:p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative w-[100px] h-[36px] flex-shrink-0">
            <Image src="/logo.png" alt="Serasa" fill className="object-contain object-left" sizes="100px" />
          </div>
          <div className="h-5 w-px bg-white/10" />
          <ChefHat size={22} className="text-[#D4AF37]" />
          <div>
            <h1 className="font-semibold text-white text-base leading-tight">Kitchen Display</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[#555] text-xs">Live · {orders.length} pesanan aktif</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundOn(s => !s)}
            title={soundOn ? 'Matikan suara' : 'Aktifkan suara'}
            className="p-2 rounded-xl border border-white/8 text-[#555] hover:text-white hover:border-white/20 transition-all"
          >
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl border border-white/8 text-[#555] hover:text-white hover:border-white/20 transition-all"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-[#D4AF37]' : ''} />
          </button>
        </div>
      </div>

      {/* New order notification */}
      {newOrderMsg && (
        <div className="mb-5 flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30"
          style={{ animation: 'slideDown 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
          <span className="text-2xl">🔔</span>
          <span className="text-[#D4AF37] font-bold text-sm">{newOrderMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#13161C] animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <CheckCircle size={56} className="text-green-400 opacity-30 mb-4" />
          <h2 className="text-white font-bold text-xl mb-1">Semua Beres!</h2>
          <p className="text-[#555] text-sm">Tidak ada pesanan aktif saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* PENDING */}
          {pending.map(order => {
            const cfg = STATUS_CONFIG.pending
            return (
              <div key={order.id}
                className="bg-[#13161C] rounded-2xl border border-yellow-500/20 overflow-hidden"
                style={{ animation: 'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1)' }}>
                {/* Card header */}
                <div className="px-5 pt-5 pb-4 border-b border-white/5">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#D4AF37] font-black text-2xl">Meja {order.table_number}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                          ⏳ BARU
                        </span>
                      </div>
                      <p className="text-[#555] text-xs mt-0.5">{order.customer_name}</p>
                    </div>
                    <ElapsedTimer createdAt={order.created_at} />
                  </div>
                  {order.order_number && (
                    <p className="text-[#333] text-[10px] font-mono mt-1">{order.order_number}</p>
                  )}
                  {order.order_type && (
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#555] mt-1">
                      {order.order_type === 'dine_in' ? '🍽 Dine In' : '🛍 Take Away'}
                    </span>
                  )}
                </div>

                {/* Items */}
                <div className="px-5 py-4 space-y-2.5">
                  {order.order_items?.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className="text-[#D4AF37] font-black text-lg w-7 text-center">{item.qty}×</span>
                      <span className="text-white font-medium text-sm">{item.name}</span>
                    </div>
                  ))}
                </div>

                {/* Action */}
                <div className="px-5 pb-5">
                  <button
                    onClick={() => updateStatus(order.id, 'cooking')}
                    disabled={updating === order.id}
                    className={`w-full py-3.5 rounded-xl text-white font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50 ${cfg.btnBg}`}
                  >
                    {updating === order.id ? '...' : cfg.btnLabel}
                  </button>
                </div>
              </div>
            )
          })}

          {/* COOKING */}
          {cooking.map(order => {
            const cfg = STATUS_CONFIG.cooking
            return (
              <div key={order.id}
                className="bg-[#13161C] rounded-2xl border border-red-500/20 overflow-hidden"
                style={{ animation: 'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1)' }}>
                <div className="px-5 pt-5 pb-4 border-b border-white/5">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#D4AF37] font-black text-2xl">Meja {order.table_number}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border animate-pulse ${cfg.badge}`}>
                          🔥 MASAK
                        </span>
                      </div>
                      <p className="text-[#555] text-xs mt-0.5">{order.customer_name}</p>
                    </div>
                    <ElapsedTimer createdAt={order.created_at} />
                  </div>
                  {order.order_number && (
                    <p className="text-[#333] text-[10px] font-mono mt-1">{order.order_number}</p>
                  )}
                  {order.order_type && (
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#555] mt-1">
                      {order.order_type === 'dine_in' ? '🍽 Dine In' : '🛍 Take Away'}
                    </span>
                  )}
                </div>

                <div className="px-5 py-4 space-y-2.5">
                  {order.order_items?.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className="text-[#D4AF37] font-black text-lg w-7 text-center">{item.qty}×</span>
                      <span className="text-white font-medium text-sm">{item.name}</span>
                    </div>
                  ))}
                </div>

                <div className="px-5 pb-5">
                  <button
                    onClick={() => updateStatus(order.id, 'ready')}
                    disabled={updating === order.id}
                    className={`w-full py-3.5 rounded-xl text-white font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50 ${cfg.btnBg}`}
                  >
                    {updating === order.id ? '...' : cfg.btnLabel}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
