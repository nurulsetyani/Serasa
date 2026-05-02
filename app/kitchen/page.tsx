'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Clock, RefreshCw, Volume2, VolumeX, ChefHat, CheckCircle2, Package, Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Order, OrderStatus } from '@/types'
import { supabase } from '@/lib/supabase'
import { IS_MOCK_MODE } from '@/lib/mock-data'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

const MOCK_ORDERS: Order[] = [
  {
    id: 'demo-1', restaurant_id: RESTAURANT_ID, table_number: '3',
    customer_name: 'Ahmad', status: 'pending', total_price: 60,
    order_number: 'ORD-ABC1', order_type: 'dine_in',
    created_at: new Date().toISOString(),
    order_items: [
      { id: 'i1', order_id: 'demo-1', menu_id: 'm1', name: 'Mie Goreng Ayam', price: 25, qty: 2 },
      { id: 'i2', order_id: 'demo-1', menu_id: 'm5', name: 'Es Cendol', price: 12, qty: 1 },
    ],
  },
  {
    id: 'demo-2', restaurant_id: RESTAURANT_ID, table_number: '5',
    customer_name: 'Fatimah', status: 'cooking', total_price: 50,
    order_number: 'ORD-XYZ2', order_type: 'take_away',
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
    order_items: [
      { id: 'i3', order_id: 'demo-2', menu_id: 'm3', name: 'Nasi Goreng Spesial', price: 22, qty: 1 },
      { id: 'i4', order_id: 'demo-2', menu_id: 'm9', name: 'Rendang Sapi', price: 35, qty: 1 },
    ],
  },
  {
    id: 'demo-3', restaurant_id: RESTAURANT_ID, table_number: '1',
    customer_name: 'Yusuf', status: 'ready', total_price: 43,
    order_number: 'ORD-DEF3', order_type: 'dine_in',
    created_at: new Date(Date.now() - 22 * 60000).toISOString(),
    order_items: [
      { id: 'i5', order_id: 'demo-3', menu_id: 'm6', name: 'Sate Ayam Madura', price: 28, qty: 1 },
      { id: 'i6', order_id: 'demo-3', menu_id: 'm11', name: 'Jus Alpukat', price: 15, qty: 1 },
    ],
  },
]

function playSound() {
  try {
    const ctx = new AudioContext()
    ;[0, 0.18, 0.36].forEach((t, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = i === 1 ? 1100 : 880
      gain.gain.setValueAtTime(0.3, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.15)
    })
  } catch {}
}

function ElapsedTimer({ createdAt }: { createdAt: string }) {
  const [mins, setMins] = useState(0)
  useEffect(() => {
    const calc = () => Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
    setMins(calc())
    const id = setInterval(() => setMins(calc()), 30000)
    return () => clearInterval(id)
  }, [createdAt])

  const isLate = mins >= 20
  return (
    <span className={`flex items-center gap-1 text-xs font-mono font-bold ${isLate ? 'text-red-500' : 'text-gray-400'}`}>
      <Clock size={11} className={isLate ? 'animate-pulse' : ''} />
      {mins}m
    </span>
  )
}

const COLUMNS: { status: OrderStatus; label: string; icon: React.ElementType; color: string; bg: string; border: string }[] = [
  { status: 'pending',   label: 'BARU',   icon: Bell,          color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { status: 'cooking',   label: 'MASAK',  icon: ChefHat,       color: '#FF6B35', bg: '#FFF3EE', border: '#FFD5C4' },
  { status: 'ready',     label: 'SIAP',   icon: CheckCircle2,  color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
]

function OrderCard({
  order, onAdvance, advancing,
}: {
  order: Order; onAdvance: () => void; advancing: boolean
}) {
  const colCfg = COLUMNS.find(c => c.status === order.status)!

  const btnConfig: Record<string, { label: string; bg: string }> = {
    pending: { label: '🔥 Mulai Masak', bg: '#FF6B35' },
    cooking: { label: '✅ Tandai Siap',  bg: '#10B981' },
    ready:   { label: '',               bg: '' },
  }
  const btn = btnConfig[order.status]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="bg-white rounded-2xl overflow-hidden border"
      style={{
        borderColor: colCfg.border,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Top stripe */}
      <div className="h-1" style={{ background: colCfg.color }} />

      {/* Header */}
      <div className="px-4 pt-3.5 pb-3 flex items-start justify-between border-b border-gray-50">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-gray-900 text-xl">Meja {order.table_number}</span>
            {order.order_type && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: colCfg.bg, color: colCfg.color }}>
                {order.order_type === 'dine_in' ? 'Dine In' : 'Take Away'}
              </span>
            )}
          </div>
          <p className="text-gray-400 text-xs mt-0.5">{order.customer_name}</p>
          {order.order_number && (
            <p className="text-gray-300 text-[9px] font-mono mt-0.5">{order.order_number}</p>
          )}
        </div>
        <ElapsedTimer createdAt={order.created_at} />
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2">
        {order.order_items?.map(item => (
          <div key={item.id} className="flex items-center gap-2.5">
            <span className="font-black text-base w-6 text-center" style={{ color: colCfg.color }}>
              {item.qty}×
            </span>
            <span className="text-gray-800 font-medium text-sm leading-tight">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Action */}
      {btn.label && (
        <div className="px-4 pb-4">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onAdvance}
            disabled={advancing}
            className="w-full py-3 rounded-xl text-white font-bold text-sm transition-opacity disabled:opacity-50"
            style={{ background: btn.bg, boxShadow: `0 4px 12px ${btn.bg}40` }}
          >
            {advancing ? '...' : btn.label}
          </motion.button>
        </div>
      )}

      {order.status === 'ready' && (
        <div className="px-4 pb-4">
          <div className="w-full py-3 rounded-xl bg-green-50 text-green-600 text-sm font-semibold text-center border border-green-100">
            ✓ Siap Disajikan
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function KitchenPage() {
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState<string | null>(null)
  const [soundOn, setSoundOn] = useState(true)
  const [newAlert, setNewAlert] = useState<string | null>(null)
  const soundRef = useRef(true)
  useEffect(() => { soundRef.current = soundOn }, [soundOn])

  const fetchOrders = useCallback(async () => {
    if (IS_MOCK_MODE) { setOrders(MOCK_ORDERS); setLoading(false); return }
    const { data } = await supabase
      .from('orders').select('*, order_items(*)')
      .eq('restaurant_id', RESTAURANT_ID)
      .in('status', ['pending', 'cooking', 'ready'])
      .order('created_at', { ascending: true })
    if (data) setOrders(data as Order[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    const channel = supabase.channel('kitchen-kanban')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        if (payload.eventType === 'INSERT') {
          const o = payload.new as Order
          if (soundRef.current) playSound()
          setNewAlert(`Pesanan baru — Meja ${o.table_number}`)
          setTimeout(() => setNewAlert(null), 4000)
          fetchOrders()
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Order
          if (updated.status === 'delivered') {
            setOrders(prev => prev.filter(o => o.id !== updated.id))
          } else {
            setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
          }
        }
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchOrders])

  async function advance(orderId: string, nextStatus: OrderStatus) {
    setAdvancing(orderId)
    await fetch(`/api/order/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    setAdvancing(null)
  }

  const nextStatus: Record<string, OrderStatus> = {
    pending: 'cooking', cooking: 'ready',
  }

  const pending = orders.filter(o => o.status === 'pending')
  const cooking = orders.filter(o => o.status === 'cooking')
  const ready   = orders.filter(o => o.status === 'ready')
  const cols = [
    { ...COLUMNS[0], items: pending },
    { ...COLUMNS[1], items: cooking },
    { ...COLUMNS[2], items: ready },
  ]

  return (
    <div className="min-h-dvh bg-[#FAFAFA]">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center justify-between px-4 lg:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative w-[90px] h-[32px]">
              <Image src="/logo.png" alt="Serasa" fill className="object-contain object-left" sizes="90px" />
            </div>
            <div className="h-5 w-px bg-gray-200" />
            <div>
              <p className="font-bold text-gray-900 text-sm">Kitchen Display</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-gray-400 text-xs">Live · {orders.length} aktif</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSoundOn(s => !s)}
              className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 transition-colors">
              {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <button onClick={fetchOrders}
              className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 transition-colors">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* New order alert */}
      <AnimatePresence>
        {newAlert && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="mx-4 mt-4 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-50 border border-amber-200">
            <span className="text-xl animate-bounce">🔔</span>
            <span className="text-amber-800 font-semibold text-sm">{newAlert}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban columns */}
      {loading ? (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <CheckCircle2 size={52} className="text-green-300 mb-4" />
          <h2 className="font-bold text-gray-800 text-xl mb-1">Semua Beres!</h2>
          <p className="text-gray-400 text-sm">Tidak ada pesanan aktif saat ini.</p>
        </div>
      ) : (
        /* Mobile: vertical sections | Desktop: 3-column grid */
        <div className="p-4 space-y-6 md:space-y-0 md:grid md:grid-cols-3 md:gap-5 md:items-start">
          {cols.map(col => {
            const ColIcon = col.icon
            return (
              <div key={col.status}>
                {/* Column header */}
                <div className="flex items-center gap-2.5 mb-3 px-1">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: col.bg }}>
                    <ColIcon size={16} style={{ color: col.color }} />
                  </div>
                  <span className="font-bold text-gray-900 text-sm">{col.label}</span>
                  <span className="ml-auto w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: col.bg, color: col.color }}>
                    {col.items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {col.items.length === 0 ? (
                    <div className="border-2 border-dashed rounded-2xl py-10 flex items-center justify-center"
                      style={{ borderColor: col.border }}>
                      <p className="text-xs font-medium" style={{ color: col.color }}>Kosong</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {col.items.map(order => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          advancing={advancing === order.id}
                          onAdvance={() => advance(order.id, nextStatus[order.status] as OrderStatus)}
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
