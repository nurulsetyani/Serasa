'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, RefreshCw, Inbox, CheckCircle, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

const KEETA_GREEN = '#00C851'
const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

interface DeliveryOrderItem {
  id: string
  name: string
  price: number
  qty: number
  notes?: string | null
}

interface DeliveryOrder {
  id: string
  order_number: string
  platform_order_id: string | null
  customer_name: string
  customer_phone: string | null
  delivery_address: string | null
  total_price: number
  status: string
  created_at: string
  order_items: DeliveryOrderItem[]
}

function TimerAgo({ createdAt }: { createdAt: string }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const calc = () => {
      const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
      setLabel(mins < 1 ? 'Baru saja' : `${mins}m lalu`)
    }
    calc()
    const id = setInterval(calc, 30000)
    return () => clearInterval(id)
  }, [createdAt])
  return <span className="flex items-center gap-1 text-[10px] text-gray-400"><Clock size={9} />{label}</span>
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function KeetaOrders({ open, onClose }: Props) {
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('source', 'keeta')
      .in('status', ['new', 'cooking'])
      .order('created_at', { ascending: true })
    setOrders((data as DeliveryOrder[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!open) return
    fetchOrders()
    const ch = supabase.channel('keeta-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [open, fetchOrders])

  async function handleAccept(order: DeliveryOrder) {
    setActionLoading(order.id)
    try {
      // Advance new → pending so order appears in KDS as BARU
      await fetch(`/api/order/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      })

      if (order.platform_order_id) {
        fetch('/api/delivery/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'keeta', platformOrderId: order.platform_order_id }),
        }).catch(() => {})
      }

      fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'kitchen',
          order: {
            id: order.id,
            order_number: order.order_number,
            table_number: 'Keeta',
            customer_name: order.customer_name,
            order_type: 'delivery',
            created_at: order.created_at,
            order_items: order.order_items,
          },
        }),
      }).catch(() => {})

      fetchOrders()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReady(order: DeliveryOrder) {
    setActionLoading(order.id)
    try {
      await fetch(`/api/order/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ready' }),
      })

      if (order.platform_order_id) {
        fetch('/api/delivery/ready', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'keeta', platformOrderId: order.platform_order_id }),
        }).catch(() => {})
      }

      fetchOrders()
    } finally {
      setActionLoading(null)
    }
  }

  const pending = orders.filter(o => o.status === 'new')
  const cooking = orders.filter(o => o.status === 'cooking')

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="relative z-10 w-full max-w-sm bg-white flex flex-col h-full"
            style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.15)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0"
              style={{ background: '#1A1208' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: KEETA_GREEN }}>
                  <span className="text-white font-black text-xs">KT</span>
                </div>
                <div>
                  <p className="font-black text-white text-sm">Keeta</p>
                  <p className="text-[10px] text-gray-400">
                    {pending.length} menunggu · {cooking.length} dimasak
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={fetchOrders}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-gray-400 hover:text-white">
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                </button>
                <button onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-gray-400 hover:text-white">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading && orders.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: '#F5F2EE' }}>
                    <Inbox size={28} className="text-gray-300" />
                  </div>
                  <p className="font-black text-gray-900 text-base mb-1">Tidak Ada Pesanan</p>
                  <p className="text-gray-400 text-sm">Pesanan Keeta akan muncul otomatis</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {orders.map(order => (
                    <motion.div key={order.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl overflow-hidden"
                      style={{ border: '1px solid #F0EAE0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
                    >
                      <div className="h-1" style={{ background: KEETA_GREEN }} />
                      <div className="p-4">
                        {/* Meta */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-black text-gray-900 text-base">{order.customer_name}</span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                order.status === 'new'
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-blue-50 text-blue-600'
                              }`}>
                                {order.status === 'new' ? 'MENUNGGU' : 'DIMASAK'}
                              </span>
                            </div>
                            {order.customer_phone && (
                              <p className="text-xs text-gray-400">{order.customer_phone}</p>
                            )}
                            <TimerAgo createdAt={order.created_at} />
                          </div>
                          <div className="text-right">
                            <p className="font-black text-sm" style={{ color: KEETA_GREEN }}>
                              {formatPrice(order.total_price)}
                            </p>
                            <p className="text-[10px] font-mono text-gray-400 mt-0.5">{order.order_number}</p>
                          </div>
                        </div>

                        {order.delivery_address && (
                          <div className="bg-green-50 rounded-lg px-3 py-2 mb-3">
                            <p className="text-[10px] font-black text-green-600 uppercase tracking-wide mb-0.5">Alamat Pengiriman</p>
                            <p className="text-xs text-gray-700">{order.delivery_address}</p>
                          </div>
                        )}

                        {/* Items */}
                        <div className="space-y-1.5 mb-4">
                          {order.order_items.map(item => (
                            <div key={item.id} className="flex items-start gap-2">
                              <span className="font-black text-sm w-6 flex-shrink-0" style={{ color: KEETA_GREEN }}>
                                {item.qty}x
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 font-semibold leading-tight">{item.name}</p>
                                {item.notes && (
                                  <p className="text-[10px] text-green-600 font-bold mt-0.5">! {item.notes}</p>
                                )}
                              </div>
                              <span className="text-[11px] text-gray-500 font-semibold flex-shrink-0">
                                {formatPrice(item.price * item.qty)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* CTA */}
                        {order.status === 'new' ? (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            disabled={actionLoading === order.id}
                            onClick={() => handleAccept(order)}
                            className="w-full py-3 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                            style={{ background: KEETA_GREEN, boxShadow: '0 4px 16px rgba(0,200,81,0.35)' }}
                          >
                            <Bell size={14} />
                            {actionLoading === order.id ? 'Memproses...' : 'Terima & Masak'}
                          </motion.button>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            disabled={actionLoading === order.id}
                            onClick={() => handleReady(order)}
                            className="w-full py-3 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                            style={{ background: '#16A34A', boxShadow: '0 4px 16px rgba(22,163,74,0.35)' }}
                          >
                            <CheckCircle size={14} />
                            {actionLoading === order.id ? 'Memproses...' : 'Siap Diambil Driver'}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
