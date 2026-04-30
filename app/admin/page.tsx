'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, FileText, Printer, X, UtensilsCrossed } from 'lucide-react'
import { Order, OrderStatus } from '@/types'
import { supabase } from '@/lib/supabase'
import { IS_MOCK_MODE } from '@/lib/mock-data'
import { useLang } from '@/context/LanguageContext'
import { formatPrice, formatTime } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

const MOCK_ORDERS: Order[] = [
  {
    id: 'demo-1', restaurant_id: RESTAURANT_ID, table_number: '3',
    customer_name: 'Ahmad', status: 'pending', total_price: 60,
    created_at: new Date().toISOString(),
    order_items: [
      { id: 'i1', order_id: 'demo-1', menu_id: 'm1', name: 'Mie Goreng Ayam', price: 25, qty: 1 },
      { id: 'i2', order_id: 'demo-1', menu_id: 'm5', name: 'Rendang Sapi', price: 35, qty: 1 },
    ],
  },
  {
    id: 'demo-2', restaurant_id: RESTAURANT_ID, table_number: '5',
    customer_name: 'Fatimah', status: 'cooking', total_price: 50,
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
    order_items: [
      { id: 'i3', order_id: 'demo-2', menu_id: 'm3', name: 'Nasi Goreng Spesial', price: 22, qty: 1 },
      { id: 'i4', order_id: 'demo-2', menu_id: 'm9', name: 'Es Cendol', price: 12, qty: 1 },
      { id: 'i5', order_id: 'demo-2', menu_id: 'm10', name: 'Es Teh Manis', price: 8, qty: 1 },
      { id: 'i5b', order_id: 'demo-2', menu_id: 'm6', name: 'Sate Ayam Madura', price: 28, qty: 1 },
    ],
  },
  {
    id: 'demo-3', restaurant_id: RESTAURANT_ID, table_number: '1',
    customer_name: 'Yusuf', status: 'ready', total_price: 40,
    created_at: new Date(Date.now() - 20 * 60000).toISOString(),
    order_items: [
      { id: 'i6', order_id: 'demo-3', menu_id: 'm6', name: 'Sate Ayam Madura', price: 28, qty: 1 },
      { id: 'i7', order_id: 'demo-3', menu_id: 'm11', name: 'Jus Alpukat', price: 15, qty: 1 },
    ],
  },
]

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

function ReportModal({ orders, onClose }: { orders: Order[]; onClose: () => void }) {
  const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')

  const now = new Date()
  const filtered = orders.filter(o => {
    const d = new Date(o.created_at)
    if (period === 'today') return d.toDateString() === now.toDateString()
    if (period === 'week') return (now.getTime() - d.getTime()) < 7 * 86400000
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const totalRevenue = filtered.reduce((s, o) => s + o.total_price, 0)
  const delivered = filtered.filter(o => o.status === 'delivered').length
  const avgOrder = filtered.length ? totalRevenue / filtered.length : 0

  // Count popular items
  const itemCount: Record<string, { name: string; qty: number }> = {}
  filtered.forEach(o => {
    o.order_items?.forEach(i => {
      if (!itemCount[i.name]) itemCount[i.name] = { name: i.name, qty: 0 }
      itemCount[i.name].qty += i.qty
    })
  })
  const topItems = Object.values(itemCount).sort((a, b) => b.qty - a.qty).slice(0, 5)

  const periodLabel = { today: 'Hari Ini', week: '7 Hari Terakhir', month: 'Bulan Ini' }[period]

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-auto p-4">
      <div className="w-full max-w-2xl bg-[#1A1A1A] rounded-2xl border border-[#D4AF37]/20 my-4">
        {/* Modal header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 no-print">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-[#D4AF37]" />
            <h2 className="font-display text-white font-bold text-lg">Laporan Penjualan</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Period filter */}
            <div className="flex gap-1 bg-[#0D0D0D] rounded-xl p-1">
              {(['today', 'week', 'month'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    period === p ? 'bg-[#D4AF37] text-[#0D0D0D]' : 'text-[#666] hover:text-white'
                  }`}
                >
                  {{ today: 'Hari Ini', week: 'Minggu', month: 'Bulan' }[p]}
                </button>
              ))}
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-[#D4AF37] text-[#0D0D0D] px-3 py-2 rounded-xl text-xs font-bold"
            >
              <Printer size={14} /> Print / PDF
            </button>
            <button onClick={onClose} className="text-[#666] hover:text-white p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Report content */}
        <div id="report-content" className="p-6">
          {/* Report header */}
          <div className="text-center mb-6 pb-4 border-b border-[#D4AF37]/20">
            <h1 className="font-display text-2xl font-bold text-[#D4AF37] mb-1">Serasa Restaurant</h1>
            <p className="text-[#888] text-sm">Laporan Penjualan — {periodLabel}</p>
            <p className="text-[#555] text-xs mt-1">Dicetak: {today}</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total Pesanan', value: `${filtered.length}`, sub: `${delivered} selesai` },
              { label: 'Total Pendapatan', value: formatPrice(totalRevenue), sub: 'semua status' },
              { label: 'Rata-rata/Pesanan', value: formatPrice(Math.round(avgOrder)), sub: 'per transaksi' },
            ].map(s => (
              <div key={s.label} className="bg-[#0D0D0D] rounded-xl p-3 text-center border border-[#D4AF37]/10">
                <p className="text-[#555] text-[10px] uppercase tracking-wider mb-1">{s.label}</p>
                <p className="text-[#D4AF37] font-bold text-base">{s.value}</p>
                <p className="text-[#444] text-[10px] mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Status breakdown */}
          <div className="mb-6">
            <h3 className="text-white font-semibold text-sm mb-3">Status Pesanan</h3>
            <div className="grid grid-cols-4 gap-2">
              {(['pending', 'cooking', 'ready', 'delivered'] as const).map(s => {
                const count = filtered.filter(o => o.status === s).length
                const rev = filtered.filter(o => o.status === s).reduce((sum, o) => sum + o.total_price, 0)
                const colors = { pending: 'text-yellow-400', cooking: 'text-red-400', ready: 'text-green-400', delivered: 'text-purple-400' }
                const labels = { pending: 'Menunggu', cooking: 'Memasak', ready: 'Siap', delivered: 'Selesai' }
                return (
                  <div key={s} className="bg-[#0D0D0D] rounded-xl p-3 border border-white/5">
                    <p className={`text-2xl font-black ${colors[s]}`}>{count}</p>
                    <p className="text-[#555] text-[10px] mt-1">{labels[s]}</p>
                    <p className="text-[#444] text-[10px]">{formatPrice(rev)}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top items */}
          {topItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-semibold text-sm mb-3">Menu Terlaris</h3>
              <div className="space-y-2">
                {topItems.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3 bg-[#0D0D0D] rounded-xl px-4 py-2.5">
                    <span className="text-[#D4AF37] font-black text-sm w-5">#{i + 1}</span>
                    <span className="text-white text-sm flex-1">{item.name}</span>
                    <span className="text-[#888] text-xs">{item.qty} porsi</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order list */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Daftar Pesanan ({filtered.length})</h3>
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0D0D0D] text-[#555] uppercase tracking-wider">
                    <th className="px-3 py-2.5 text-left">Meja</th>
                    <th className="px-3 py-2.5 text-left">Customer</th>
                    <th className="px-3 py-2.5 text-left">Item</th>
                    <th className="px-3 py-2.5 text-left">Status</th>
                    <th className="px-3 py-2.5 text-right">Total</th>
                    <th className="px-3 py-2.5 text-left">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-3 py-6 text-center text-[#444]">Tidak ada pesanan</td></tr>
                  ) : filtered.map((o, i) => (
                    <tr key={o.id} className={`border-t border-white/5 ${i % 2 === 0 ? 'bg-[#0D0D0D]/50' : ''}`}>
                      <td className="px-3 py-2.5 text-[#D4AF37] font-bold">Meja {o.table_number}</td>
                      <td className="px-3 py-2.5 text-white">{o.customer_name}</td>
                      <td className="px-3 py-2.5 text-[#666]">{o.order_items?.length ?? 0} item</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          { pending: 'bg-yellow-500/15 text-yellow-400', cooking: 'bg-red-500/15 text-red-400', ready: 'bg-green-500/15 text-green-400', delivered: 'bg-purple-500/15 text-purple-400' }[o.status]
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-[#D4AF37] font-semibold">{formatPrice(o.total_price)}</td>
                      <td className="px-3 py-2.5 text-[#555]">{formatTime(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-[#D4AF37]/20 bg-[#0D0D0D]">
                      <td colSpan={4} className="px-3 py-2.5 text-[#888] font-semibold">TOTAL</td>
                      <td className="px-3 py-2.5 text-right text-[#D4AF37] font-black">{formatPrice(totalRevenue)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-content, #report-content * { visibility: visible; }
          #report-content { position: fixed; top: 0; left: 0; width: 100%; background: white !important; color: black !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const { t, isRTL } = useLang()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [newOrderId, setNewOrderId] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    if (IS_MOCK_MODE) {
      setOrders(MOCK_ORDERS)
      setLoading(false)
      return
    }
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
      {showReport && <ReportModal orders={orders} onClose={() => setShowReport(false)} />}
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/admin/menu')}
              className="flex items-center gap-1.5 bg-[#1A1A1A] border border-white/10 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:border-[#D4AF37]/30 transition-colors"
            >
              <UtensilsCrossed size={14} /> Kelola Menu
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[#D4AF37]/20 transition-colors"
            >
              <FileText size={14} /> Laporan PDF
            </button>
            <button onClick={fetchOrders} className="btn-ghost p-2 rounded-xl" title="Refresh">
              <RefreshCw size={16} className={loading ? 'animate-spin text-gold' : 'text-ink-muted'} />
            </button>
          </div>
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
