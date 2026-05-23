'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, QrCode, Clock, ChevronRight, RefreshCw, Inbox } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePOSStore } from '@/stores/pos.store'
import { formatPrice } from '@/lib/utils'

const P = '#FF6B35'
const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

interface QROrderItem {
  id: string
  menu_id: string
  name: string
  price: number
  qty: number
  notes?: string | null
}

interface QROrder {
  id: string
  order_number: string
  customer_name: string
  table_number: string
  order_type: 'dine_in' | 'take_away' | 'delivery'
  total_price: number
  created_at: string
  order_items: QROrderItem[]
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

const ORDER_TYPE_LABEL: Record<string, string> = {
  dine_in: '🍽 Dine In', take_away: '🛍 Take Away', delivery: '🛵 Delivery',
}

interface Props {
  open: boolean
  onClose: () => void
  onOrderLoaded: () => void
}

export default function IncomingOrders({ open, onClose, onOrderLoaded }: Props) {
  const [orders, setOrders] = useState<QROrder[]>([])
  const [loading, setLoading] = useState(false)
  const loadFromQROrder = usePOSStore(s => s.loadFromQROrder)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('source', 'qr')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    setOrders((data as QROrder[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!open) return
    fetchOrders()

    const ch = supabase.channel('incoming-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [open, fetchOrders])

  function handleLoad(order: QROrder) {
    loadFromQROrder({
      orderId: order.id,
      tableNumber: order.table_number,
      customerName: order.customer_name,
      orderType: order.order_type,
      items: order.order_items.map(i => ({
        menuId: i.menu_id,
        name: i.name,
        unitPrice: i.price,
        qty: i.qty,
        note: i.notes ?? '',
      })),
    })
    onOrderLoaded()
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
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
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: P }}>
                  <QrCode size={15} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-white text-sm">Pesanan QR</p>
                  <p className="text-[10px] text-gray-400">{orders.length} menunggu diproses</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={fetchOrders} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-gray-400 hover:text-white">
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                </button>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-gray-400 hover:text-white">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading && orders.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-orange-500 animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: '#F5F2EE' }}>
                    <Inbox size={28} className="text-gray-300" />
                  </div>
                  <p className="font-black text-gray-900 text-base mb-1">Tidak Ada Pesanan</p>
                  <p className="text-gray-400 text-sm">Pesanan dari QR code akan muncul di sini secara otomatis</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {orders.map(order => (
                    <motion.div key={order.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl overflow-hidden"
                      style={{ border: '1px solid #F0EAE0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
                    >
                      {/* Top stripe */}
                      <div className="h-1" style={{ background: P }} />

                      <div className="p-4">
                        {/* Order meta */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-black text-gray-900 text-base">Meja {order.table_number}</span>
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                                MENUNGGU
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 font-semibold">{order.customer_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-gray-400">{ORDER_TYPE_LABEL[order.order_type]}</span>
                              <span className="text-gray-300">·</span>
                              <TimerAgo createdAt={order.created_at} />
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-sm" style={{ color: P }}>{formatPrice(order.total_price)}</p>
                            <p className="text-[10px] font-mono text-gray-400 mt-0.5">{order.order_number}</p>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-1.5 mb-4">
                          {order.order_items.map(item => (
                            <div key={item.id} className="flex items-start gap-2">
                              <span className="font-black text-sm w-6 flex-shrink-0" style={{ color: P }}>
                                {item.qty}×
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 font-semibold leading-tight">{item.name}</p>
                                {item.notes && (
                                  <p className="text-[10px] text-orange-500 font-bold mt-0.5">⚠ {item.notes}</p>
                                )}
                              </div>
                              <span className="text-[11px] text-gray-500 font-semibold flex-shrink-0">
                                {formatPrice(item.price * item.qty)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* CTA */}
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleLoad(order)}
                          className="w-full py-3 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2"
                          style={{ background: P, boxShadow: `0 4px 16px rgba(255,107,53,0.35)` }}
                        >
                          Proses Pesanan
                          <ChevronRight size={15} />
                        </motion.button>
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
