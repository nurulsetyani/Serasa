'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, ChevronRight, RefreshCw, Inbox, CreditCard, Eye, PlusCircle, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePOSStore } from '@/stores/pos.store'
import { formatPrice } from '@/lib/utils'

const P = '#FF6B35'
const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

interface QROrderItem { id: string; menu_id: string; name: string; price: number; qty: number; notes?: string | null }
interface QROrder {
  id: string; order_number: string; customer_name: string; table_number: string
  order_type: 'dine_in' | 'take_away' | 'delivery'; total_price: number
  status: string; created_at: string; order_items: QROrderItem[]
}

// Status display config
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  new:              { label: 'Menunggu',    color: '#F59E0B', bg: '#FEF3C7' },
  accepted:         { label: 'Diterima',    color: '#6366F1', bg: '#EEF2FF' },
  preparing:        { label: 'Dimasak',     color: '#FF6B35', bg: '#FFF0E8' },
  ready:            { label: 'Siap',        color: '#22C55E', bg: '#F0FDF4' },
  served:           { label: 'Disajikan',   color: '#06B6D4', bg: '#ECFEFF' },
  awaiting_payment: { label: 'Tagih!',      color: '#EF4444', bg: '#FEF2F2' },
  // Legacy
  pending:          { label: 'Pending',     color: '#F59E0B', bg: '#FEF3C7' },
  cooking:          { label: 'Dimasak',     color: '#FF6B35', bg: '#FFF0E8' },
}

const ORDER_TYPE_LABEL: Record<string, string> = {
  dine_in: '🍽 Dine In', take_away: '🛍 Take Away', delivery: '🛵 Delivery',
}

function TimerAgo({ createdAt }: { createdAt: string }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const calc = () => {
      const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
      setLabel(mins < 1 ? 'Baru saja' : `${mins}m lalu`)
    }
    calc(); const id = setInterval(calc, 30000); return () => clearInterval(id)
  }, [createdAt])
  return <span className="flex items-center gap-1 text-[10px] text-gray-400"><Clock size={9} />{label}</span>
}

interface Props { open: boolean; onClose: () => void; onOrderLoaded: () => void }

export default function IncomingOrders({ open, onClose, onOrderLoaded }: Props) {
  const [orders, setOrders]       = useState<QROrder[]>([])
  const [loading, setLoading]     = useState(false)
  const [patching, setPatching]   = useState<string | null>(null)
  const [cancellingItem, setCancellingItem] = useState<string | null>(null)
  const loadFromQROrder = usePOSStore(s => s.loadFromQROrder)
  const setSourceQrOrderId = usePOSStore(s => s.setSourceQrOrderId)
  const enterEditMode = usePOSStore(s => s.enterEditMode)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', RESTAURANT_ID)
      .in('source', ['qr', 'hungerstation', 'keeta'])
      .in('status', ['new', 'accepted', 'preparing', 'ready', 'served', 'awaiting_payment', 'pending', 'cooking'])
      .order('created_at', { ascending: true })
    setOrders((data as QROrder[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!open) return
    fetchOrders()
    const ch = supabase.channel('order-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [open, fetchOrders])

  const EDITABLE_STATUSES = ['new', 'accepted', 'preparing']

  function handleEnterEditMode(order: QROrder) {
    enterEditMode(order.id, {
      orderNumber:   order.order_number,
      tableNumber:   order.table_number,
      customerName:  order.customer_name,
      status:        order.status,
      existingItems: order.order_items
        .filter(i => !(i as QROrderItem & { cancelled?: boolean }).cancelled)
        .map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
    })
    onClose()
  }

  async function handleCancelItem(orderId: string, itemId: string, itemName: string) {
    if (!confirm(`Batalkan "${itemName}" dari pesanan?`)) return
    setCancellingItem(itemId)
    try {
      const res = await fetch(`/api/order/${orderId}/item/${itemId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { alert(data.error ?? 'Gagal membatalkan item'); return }
      await fetchOrders()
    } finally {
      setCancellingItem(null)
    }
  }

  // Load order into POS cart for checkout
  function handleLoadForCheckout(order: QROrder) {
    loadFromQROrder({
      orderId:      order.id,
      tableNumber:  order.table_number,
      customerName: order.customer_name,
      orderType:    order.order_type,
      items: order.order_items.map(i => ({
        menuId: i.menu_id, name: i.name, unitPrice: i.price, qty: i.qty, note: i.notes ?? '',
      })),
    })
    setSourceQrOrderId(order.id)
    onOrderLoaded()
    onClose()
  }

  // Mark order as awaiting_payment
  async function handleRequestPayment(orderId: string) {
    setPatching(orderId)
    await fetch(`/api/order/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'awaiting_payment' }),
    })
    await fetchOrders()
    setPatching(null)
  }

  const awaitingCount = orders.filter(o => o.status === 'awaiting_payment').length

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
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: P }}>
                  <Eye size={15} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-white text-sm">Monitor Pesanan</p>
                  <p className="text-[10px] text-gray-400">
                    {orders.length} aktif
                    {awaitingCount > 0 && (
                      <span className="ml-2 text-red-400 font-bold">· {awaitingCount} perlu tagih</span>
                    )}
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
                  <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-orange-500 animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: '#F5F2EE' }}>
                    <Inbox size={28} className="text-gray-300" />
                  </div>
                  <p className="font-black text-gray-900 text-base mb-1">Tidak Ada Pesanan</p>
                  <p className="text-gray-400 text-sm">Pesanan aktif akan muncul di sini</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {orders.map(order => {
                    const scfg = STATUS_CFG[order.status] ?? { label: order.status, color: '#9CA3AF', bg: '#F3F4F6' }
                    const isCheckout = order.status === 'awaiting_payment' || order.status === 'served'
                    const isServed   = order.status === 'served'
                    return (
                      <motion.div key={order.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl overflow-hidden"
                        style={{
                          border: isCheckout ? '2px solid #EF4444' : '1px solid #F0EAE0',
                          boxShadow: isCheckout ? '0 4px 16px rgba(239,68,68,0.12)' : '0 2px 12px rgba(0,0,0,0.05)',
                        }}
                      >
                        {/* Status top stripe */}
                        <div className="h-1" style={{ background: scfg.color }} />

                        <div className="p-4">
                          {/* Meta */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-black text-gray-900 text-base">Meja {order.table_number}</span>
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                                  style={{ background: scfg.bg, color: scfg.color }}>
                                  {scfg.label}
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
                          <div className="space-y-1 mb-3">
                            {order.order_items
                              .filter(i => !(i as QROrderItem & { cancelled?: boolean }).cancelled)
                              .map(item => (
                              <div key={item.id} className="flex items-center gap-2">
                                <span className="font-black text-xs w-5 flex-shrink-0" style={{ color: P }}>{item.qty}×</span>
                                <p className="text-xs text-gray-700 font-medium truncate flex-1">{item.name}</p>
                                <span className="text-[10px] text-gray-400">{formatPrice(item.price * item.qty)}</span>
                                {EDITABLE_STATUSES.includes(order.status) && (
                                  <button
                                    onClick={() => handleCancelItem(order.id, item.id, item.name)}
                                    disabled={cancellingItem === item.id}
                                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-red-100 transition-colors"
                                    style={{ color: cancellingItem === item.id ? '#FCA5A5' : '#EF4444' }}
                                  >
                                    {cancellingItem === item.id
                                      ? <span style={{ fontSize: 8 }}>…</span>
                                      : <Trash2 size={10} />}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            {/* Tambah item — saat order masih bisa diubah */}
                            {EDITABLE_STATUSES.includes(order.status) && (
                              <motion.button whileTap={{ scale: 0.97 }}
                                onClick={() => handleEnterEditMode(order)}
                                className="flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5"
                                style={{
                                  background: 'rgba(48,209,88,0.10)',
                                  border: '1.5px solid rgba(48,209,88,0.35)',
                                  color: '#16A34A',
                                }}>
                                <PlusCircle size={12} />
                                Tambah Item
                              </motion.button>
                            )}
                            {/* served or awaiting_payment → checkout langsung */}
                            {(order.status === 'served' || order.status === 'awaiting_payment') && (
                              <motion.button whileTap={{ scale: 0.97 }}
                                onClick={() => handleLoadForCheckout(order)}
                                disabled={patching === order.id}
                                className="flex-1 py-2.5 rounded-xl text-white font-black text-xs flex items-center justify-center gap-1.5"
                                style={{ background: '#EF4444', boxShadow: '0 4px 16px rgba(239,68,68,0.40)' }}>
                                <CreditCard size={12} />
                                {patching === order.id ? '...' : 'Checkout & Bayar'}
                                <ChevronRight size={11} />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
