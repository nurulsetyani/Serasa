'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Clock, RefreshCw, Volume2, VolumeX, ChefHat, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Order, OrderStatus } from '@/types'
import { supabase } from '@/lib/supabase'
import { IS_MOCK_MODE } from '@/lib/mock-data'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!
const P = '#F0A030'

const MOCK_ORDERS: Order[] = [
  { id: 'd1', restaurant_id: RESTAURANT_ID, table_number: '3', customer_name: 'Ahmad',
    status: 'pending', total_price: 60, order_number: 'SV-930686', order_type: 'dine_in',
    created_at: new Date().toISOString(),
    order_items: [
      { id: 'i1', order_id: 'd1', menu_id: 'm1', name: 'Mie Goreng Ayam', price: 25, qty: 2 },
      { id: 'i2', order_id: 'd1', menu_id: 'm5', name: 'Es Cendol', price: 12, qty: 1 },
    ] },
  { id: 'd2', restaurant_id: RESTAURANT_ID, table_number: '5', customer_name: 'Fatimah',
    status: 'cooking', total_price: 57, order_number: 'SV-847291', order_type: 'take_away',
    created_at: new Date(Date.now() - 9 * 60000).toISOString(),
    order_items: [
      { id: 'i3', order_id: 'd2', menu_id: 'm3', name: 'Nasi Goreng Spesial', price: 22, qty: 1 },
      { id: 'i4', order_id: 'd2', menu_id: 'm6', name: 'Rendang Sapi', price: 35, qty: 1 },
    ] },
]

function playBeep() {
  try {
    const ctx = new AudioContext()
    ;[0, 0.18, 0.36].forEach((t, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = i === 1 ? 1100 : 880
      g.gain.setValueAtTime(0.3, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15)
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.15)
    })
  } catch {}
}

function Timer({ createdAt }: { createdAt: string }) {
  const [mins, setMins] = useState(0)
  useEffect(() => {
    const calc = () => Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
    setMins(calc()); const id = setInterval(() => setMins(calc()), 30000)
    return () => clearInterval(id)
  }, [createdAt])
  const late = mins >= 20
  return (
    <span className={`flex items-center gap-1 text-xs font-black font-mono ${late ? 'animate-pulse' : ''}`}
      style={{ color: late ? '#EF4444' : '#9A8A7A' }}>
      <Clock size={11} /> {mins}m
    </span>
  )
}

const COLS = [
  { status: 'pending' as OrderStatus, label: 'BARU',  color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', nextLabel: '🔥 Mulai Masak', nextStatus: 'cooking' as OrderStatus, btnColor: P },
  { status: 'cooking' as OrderStatus, label: 'MASAK', color: P,         bg: '#FFF8EE', border: '#FDE0A8', nextLabel: '✅ Siap',        nextStatus: 'ready'   as OrderStatus, btnColor: '#22C55E' },
  { status: 'ready'   as OrderStatus, label: 'SIAP',  color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0', nextLabel: '',               nextStatus: 'delivered' as OrderStatus, btnColor: '' },
]

export default function KitchenPage() {
  const [orders, setOrders]     = useState<Order[]>([])
  const [loading, setLoading]   = useState(true)
  const [advancing, setAdv]     = useState<string | null>(null)
  const [soundOn, setSoundOn]   = useState(true)
  const [alert, setAlert]       = useState<string | null>(null)
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
    const ch = supabase.channel('kitchen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, p => {
        if (p.eventType === 'INSERT') {
          if (soundRef.current) playBeep()
          const o = p.new as Order
          setAlert(`🆕 Pesanan baru — Meja ${o.table_number}`)
          setTimeout(() => setAlert(null), 4000)
          fetchOrders()
        } else if (p.eventType === 'UPDATE') {
          const u = p.new as Order
          if (u.status === 'delivered') setOrders(prev => prev.filter(o => o.id !== u.id))
          else setOrders(prev => prev.map(o => o.id === u.id ? { ...o, ...u } : o))
        }
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchOrders])

  async function advance(orderId: string, nextStatus: OrderStatus) {
    setAdv(orderId)
    await fetch(`/api/order/${orderId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    setAdv(null)
  }

  return (
    <div className="min-h-dvh bg-[#FAFAF8]">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative w-[90px] h-[32px]">
              <Image src="/logo.png" alt="Serasa" fill className="object-contain object-left" sizes="90px" />
            </div>
            <div className="h-5 w-px bg-gray-200" />
            <div>
              <p className="font-black text-gray-900 text-sm">Kitchen Display</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-gray-400 text-xs">{orders.length} aktif</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSoundOn(s => !s)}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <button onClick={fetchOrders}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Alert */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="mx-4 mt-4 flex items-center gap-3 px-5 py-3.5 rounded-2xl"
            style={{ background: `${P}15`, border: `1px solid ${P}40` }}>
            <span className="text-xl animate-bounce">🔔</span>
            <span className="font-bold text-sm" style={{ color: P }}>{alert}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-48 animate-pulse"
              style={{ border: '1px solid #F0EAE0' }} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <CheckCircle2 size={52} style={{ color: `${P}50` }} className="mb-4" />
          <h2 className="font-black text-gray-900 text-xl mb-1">Semua Beres!</h2>
          <p className="text-gray-400 text-sm">Tidak ada pesanan aktif.</p>
        </div>
      ) : (
        <div className="p-4 space-y-6 md:space-y-0 md:grid md:grid-cols-3 md:gap-5 md:items-start mt-2">
          {COLS.map(col => {
            const colOrders = orders.filter(o => o.status === col.status)
            return (
              <div key={col.status}>
                {/* Column label */}
                <div className="flex items-center gap-2.5 mb-3 px-1">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: col.bg }}>
                    <ChefHat size={16} style={{ color: col.color }} />
                  </div>
                  <span className="font-black text-sm" style={{ color: '#1A1208' }}>{col.label}</span>
                  <span className="ml-auto w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: col.bg, color: col.color }}>{colOrders.length}</span>
                </div>

                <div className="space-y-3">
                  {colOrders.length === 0 ? (
                    <div className="border-2 border-dashed rounded-2xl py-10 flex items-center justify-center"
                      style={{ borderColor: col.border }}>
                      <p className="text-xs font-bold" style={{ color: col.color }}>Kosong</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {colOrders.map(order => (
                        <motion.div key={order.id} layout
                          initial={{ opacity: 0, scale: 0.95, y: 12 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.92 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                          className="bg-white rounded-2xl overflow-hidden"
                          style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.06)', border: `1px solid ${col.border}` }}
                        >
                          {/* Top stripe */}
                          <div className="h-1" style={{ background: col.color }} />

                          {/* Header */}
                          <div className="px-4 pt-4 pb-3 border-b border-gray-50">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-2xl" style={{ color: '#1A1208' }}>
                                    Meja {order.table_number}
                                  </span>
                                  <span className="text-[9px] font-black px-2 py-1 rounded-full"
                                    style={{ background: col.bg, color: col.color }}>
                                    {col.label}
                                  </span>
                                </div>
                                <p className="text-gray-400 text-xs">{order.customer_name}</p>
                              </div>
                              <Timer createdAt={order.created_at} />
                            </div>
                            {order.order_number && (
                              <p className="text-[10px] font-mono" style={{ color: '#C0B0A0' }}>
                                {order.order_number}
                              </p>
                            )}
                            {order.order_type && (
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 bg-gray-100 text-gray-500">
                                {order.order_type === 'dine_in' ? '🍽 Dine In' : '🛍 Take Away'}
                              </span>
                            )}
                          </div>

                          {/* Items */}
                          <div className="px-4 py-3 space-y-2">
                            {order.order_items?.map(item => (
                              <div key={item.id} className="flex items-center gap-3">
                                <span className="font-black text-lg w-7 text-center" style={{ color: P }}>
                                  {item.qty}×
                                </span>
                                <span className="text-gray-800 font-semibold text-sm">{item.name}</span>
                              </div>
                            ))}
                          </div>

                          {/* Action */}
                          {col.nextLabel && (
                            <div className="px-4 pb-4">
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => advance(order.id, col.nextStatus)}
                                disabled={advancing === order.id}
                                className="w-full py-3.5 rounded-full text-white font-black text-sm disabled:opacity-50"
                                style={{ background: col.btnColor, boxShadow: `0 4px 14px ${col.btnColor}40` }}>
                                {advancing === order.id ? '...' : col.nextLabel}
                              </motion.button>
                            </div>
                          )}
                          {col.status === 'ready' && (
                            <div className="px-4 pb-4">
                              <div className="w-full py-3 rounded-full bg-green-50 text-green-600 text-sm font-black text-center border border-green-100">
                                ✓ Siap Disajikan
                              </div>
                            </div>
                          )}
                        </motion.div>
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
