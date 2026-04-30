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

  const todayRevenue = orders
    .filter(o => o.status === 'delivered' && new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((s, o) => s + o.total_price, 0)

  return (
    <div className="min-h-dvh bg-[#0D0D0D]" dir={isRTL ? 'rtl' : 'ltr'}>
      {showReport && <ReportModal orders={orders} onClose={() => setShowReport(false)} />}

      {/* ── SIDEBAR (desktop) ─────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-56 bg-[#111] border-r border-white/5 z-40 py-6">
        <div className="px-5 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🌿</span>
            <span className="font-display font-bold text-white text-base">Serasa</span>
          </div>
          <p className="text-[#444] text-[11px]">Restaurant Admin</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {[
            { icon: '📋', label: 'Pesanan', active: true },
            { icon: '🍽️', label: 'Kelola Menu', action: () => router.push('/admin/menu') },
            { icon: '👨‍🍳', label: 'Kitchen', action: () => router.push('/kitchen') },
            { icon: '📊', label: 'Laporan', action: () => setShowReport(true) },
          ].map(nav => (
            <button
              key={nav.label}
              onClick={nav.action}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                nav.active
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'
                  : 'text-[#666] hover:bg-[#1A1A1A] hover:text-white'
              }`}
            >
              <span>{nav.icon}</span>
              {nav.label}
            </button>
          ))}
        </nav>
        <div className="px-5 pb-2">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#1A1A1A]">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[#555] text-[11px]">Live · Realtime ON</span>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────── */}
      <div className="lg:ml-56">

        {/* Top header */}
        <header className="sticky top-0 z-30 bg-[#0D0D0D]/96 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3.5">
            <div>
              <h1 className="font-display text-lg font-bold text-white leading-tight">Dashboard Pesanan</h1>
              <p className="text-[#444] text-xs">{new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long' })}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile nav */}
              <div className="flex lg:hidden gap-1.5">
                <button onClick={() => router.push('/admin/menu')}
                  className="p-2 rounded-xl bg-[#1A1A1A] border border-white/8 text-[#888] hover:text-white transition-colors">
                  <UtensilsCrossed size={15} />
                </button>
                <button onClick={() => setShowReport(true)}
                  className="p-2 rounded-xl bg-[#1A1A1A] border border-white/8 text-[#888] hover:text-[#D4AF37] transition-colors">
                  <FileText size={15} />
                </button>
              </div>
              <button onClick={fetchOrders}
                className="p-2 rounded-xl bg-[#1A1A1A] border border-white/8 text-[#888] hover:text-white transition-colors">
                <RefreshCw size={15} className={loading ? 'animate-spin text-[#D4AF37]' : ''} />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-0 border-t border-white/5">
            {[
              { label: 'Semua', value: counts.all, color: 'text-white', bg: '' },
              { label: 'Pending', value: counts.pending, color: 'text-yellow-400', bg: filter === 'pending' ? 'bg-yellow-500/5' : '' },
              { label: 'Memasak', value: counts.cooking, color: 'text-red-400', bg: filter === 'cooking' ? 'bg-red-500/5' : '' },
              { label: 'Selesai', value: counts.delivered, color: 'text-purple-400', bg: filter === 'delivered' ? 'bg-purple-500/5' : '' },
            ].map((stat, i) => (
              <button
                key={stat.label}
                onClick={() => setFilter(['all','pending','cooking','delivered'][i])}
                className={`flex flex-col items-center py-3 border-r border-white/5 last:border-0 transition-colors ${stat.bg} hover:bg-white/3`}
              >
                <span className={`font-black text-xl leading-none ${stat.color}`}>{stat.value}</span>
                <span className="text-[#444] text-[10px] mt-0.5">{stat.label}</span>
              </button>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5 px-4 lg:px-6 py-2.5 overflow-x-auto scrollbar-hide border-t border-white/5">
            {STATUS_FILTERS.map(sf => (
              <button
                key={sf.value}
                onClick={() => setFilter(sf.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  filter === sf.value
                    ? 'bg-[#D4AF37] text-[#0D0D0D]'
                    : 'bg-[#1A1A1A] text-[#555] hover:text-white hover:bg-[#222]'
                }`}
              >
                {sf.label}
                <span className={`text-[10px] font-black rounded px-1 ${filter === sf.value ? 'bg-[#0D0D0D]/20' : 'bg-[#222]'}`}>
                  {counts[sf.value as keyof typeof counts]}
                </span>
              </button>
            ))}
          </div>
        </header>

        {/* Revenue strip */}
        <div className="mx-4 lg:mx-6 mt-4 bg-gradient-to-r from-[#D4AF37]/8 to-transparent border border-[#D4AF37]/15 rounded-2xl px-5 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[#666] text-[11px] uppercase tracking-wider">Pendapatan Hari Ini</p>
            <p className="text-[#D4AF37] font-black text-2xl mt-0.5">{formatPrice(todayRevenue)}</p>
          </div>
          <div className="text-right">
            <p className="text-[#666] text-[11px] uppercase tracking-wider">Total Pesanan</p>
            <p className="text-white font-black text-2xl mt-0.5">{counts.all}</p>
          </div>
        </div>

        {/* New order alert */}
        {newOrderId && (
          <div className="mx-4 lg:mx-6 mt-3 px-4 py-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center gap-2.5 animate-fade-in">
            <span className="text-lg animate-bounce">🔔</span>
            <span className="text-[#D4AF37] font-bold text-sm">Pesanan baru masuk!</span>
          </div>
        )}

        {/* Orders */}
        <main className="px-4 lg:px-6 py-4 pb-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton rounded-2xl h-44" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-white/5 flex items-center justify-center mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <p className="text-white font-semibold mb-1">Tidak ada pesanan</p>
              <p className="text-[#444] text-sm">Pesanan akan muncul di sini secara realtime</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(order => {
                const btn = STATUS_BUTTON[order.status]
                const next = NEXT_STATUS[order.status]
                const isNew = order.id === newOrderId

                return (
                  <div
                    key={order.id}
                    className={`bg-[#141414] rounded-2xl border overflow-hidden transition-all ${
                      isNew ? 'border-[#D4AF37]/50 shadow-[0_0_24px_rgba(212,175,55,0.12)]' : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Card header */}
                    <div className={`px-4 py-3 flex items-center justify-between border-b border-white/5 ${
                      order.status === 'pending' ? 'bg-yellow-500/5' :
                      order.status === 'cooking' ? 'bg-red-500/5' :
                      order.status === 'ready'   ? 'bg-green-500/5' : 'bg-purple-500/5'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                          <span className="text-[#D4AF37] font-black text-sm">{order.table_number}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-white font-bold text-sm">{order.customer_name}</p>
                            {isNew && <span className="text-[9px] bg-[#D4AF37] text-[#0D0D0D] px-1.5 py-0.5 rounded-full font-black">NEW</span>}
                          </div>
                          <p className="text-[#444] text-[10px]">Meja {order.table_number} · {formatTime(order.created_at)}</p>
                        </div>
                      </div>
                      <StatusBadge status={order.status} size="sm" />
                    </div>

                    {/* Items */}
                    <div className="px-4 py-3 space-y-1.5">
                      {order.order_items?.map(item => (
                        <div key={item.id} className="flex items-start justify-between gap-2 text-xs">
                          <div className="flex-1 min-w-0">
                            <span className="text-[#888]">{item.qty}× {item.name}</span>
                            {item.notes && (
                              <p className="text-[#555] italic text-[10px] mt-0.5">📝 {item.notes}</p>
                            )}
                          </div>
                          <span className="text-[#D4AF37] font-semibold flex-shrink-0">{formatPrice(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="px-4 pb-4 space-y-2.5">
                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-[#555] text-xs">{order.order_items?.length ?? 0} item</span>
                        <span className="text-[#D4AF37] font-black text-base">{formatPrice(order.total_price)}</span>
                      </div>
                      {next && btn.label && (
                        <button
                          onClick={() => updateStatus(order.id, order.status)}
                          disabled={updating === order.id}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 ${btn.class}`}
                        >
                          {updating === order.id ? '⟳ Memproses...' : btn.label}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
