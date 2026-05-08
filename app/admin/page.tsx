'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  RefreshCw, FileText, Printer, X, UtensilsCrossed,
  ClipboardList, ChefHat, BarChart3, Clock, CheckCircle2,
  Flame, CircleCheck, TrendingUp, ShoppingBag, AlertCircle,
  Bell
} from 'lucide-react'
import { Order, OrderStatus } from '@/types'
import { supabase } from '@/lib/supabase'
import { IS_MOCK_MODE } from '@/lib/mock-data'
import { useLang } from '@/context/LanguageContext'
import { formatPrice, formatTime } from '@/lib/utils'

// ── Design tokens ────────────────────────────────────────────
const C = {
  bg:       '#0F1115',
  card:     '#171A21',
  border:   '#23262F',
  accent:   '#F0A030',
  text:     '#FFFFFF',
  muted:    '#A1A1AA',
  success:  '#22C55E',
  warning:  '#F0A030',
  danger:   '#EF4444',
  sidebar:  '#13161C',
}

// ── Constants ────────────────────────────────────────────────
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
      { id: 'i5b', order_id: 'demo-2', menu_id: 'm6', name: 'Sate Ayam Madura', price: 28, qty: 1 },
    ],
  },
  {
    id: 'demo-3', restaurant_id: RESTAURANT_ID, table_number: '1',
    customer_name: 'Yusuf', status: 'ready', total_price: 43,
    created_at: new Date(Date.now() - 20 * 60000).toISOString(),
    order_items: [
      { id: 'i6', order_id: 'demo-3', menu_id: 'm6', name: 'Sate Ayam Madura', price: 28, qty: 1 },
      { id: 'i7', order_id: 'demo-3', menu_id: 'm11', name: 'Jus Alpukat', price: 15, qty: 1 },
    ],
  },
]

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending: 'cooking', cooking: 'ready', ready: 'delivered', delivered: null,
}

const STATUS_CONFIG: Record<OrderStatus, {
  label: string; dot: string; badge: string; btnLabel: string; btnClass: string; icon: React.ElementType
}> = {
  pending:   { label: 'Pending',   dot: 'bg-[#F59E0B]', badge: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20', btnLabel: 'Start Cooking', btnClass: 'bg-[#EF4444] hover:bg-[#DC2626] text-white', icon: Clock },
  cooking:   { label: 'Cooking',   dot: 'bg-[#EF4444]', badge: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20', btnLabel: 'Mark Ready',    btnClass: 'bg-[#22C55E] hover:bg-[#16A34A] text-white', icon: Flame },
  ready:     { label: 'Ready',     dot: 'bg-[#22C55E]', badge: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20', btnLabel: 'Mark Delivered', btnClass: 'bg-[#6366F1] hover:bg-[#4F46E5] text-white', icon: CircleCheck },
  delivered: { label: 'Delivered', dot: 'bg-[#6366F1]', badge: 'bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20', btnLabel: '',             btnClass: '', icon: CheckCircle2 },
}

// ── Sub-components ───────────────────────────────────────────
function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="rounded-xl p-4 border flex flex-col gap-3 transition-all duration-200 hover:border-[#2D303A]"
      style={{ background: C.card, borderColor: C.border }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: C.muted }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight" style={{ color: C.text }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: C.muted }}>{sub}</p>}
      </div>
    </div>
  )
}

function SidebarItem({ icon: Icon, label, active, onClick }: {
  icon: React.ElementType; label: string; active?: boolean; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left relative group"
      style={{
        background: active ? '#1C1F26' : 'transparent',
        color: active ? C.text : C.muted,
      }}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
          style={{ background: C.accent }} />
      )}
      <Icon size={16} className="flex-shrink-0" />
      {label}
    </button>
  )
}

function FilterTab({ label, count, active, onClick }: {
  label: string; count: number; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-150 border"
      style={active
        ? { background: C.accent, color: '#000', borderColor: C.accent }
        : { background: 'transparent', color: C.muted, borderColor: C.border }
      }
    >
      {label}
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: active ? 'rgba(0,0,0,0.15)' : '#1C1F26', color: 'inherit' }}>
        {count}
      </span>
    </button>
  )
}

// ── Report Modal ─────────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-auto p-4">
      <div className="w-full max-w-2xl rounded-xl border my-4 overflow-hidden"
        style={{ background: C.card, borderColor: C.border }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b no-print" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2.5">
            <FileText size={18} style={{ color: C.accent }} />
            <span className="font-semibold text-base" style={{ color: C.text }}>Laporan Penjualan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: C.bg }}>
              {(['today', 'week', 'month'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={period === p ? { background: C.accent, color: '#000' } : { color: C.muted }}>
                  {{ today: 'Hari Ini', week: 'Minggu', month: 'Bulan' }[p]}
                </button>
              ))}
            </div>
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: C.accent, color: '#000' }}>
              <Printer size={13} /> Print
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: C.muted }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div id="report-content" className="p-6 space-y-6">
          {/* Title */}
          <div className="text-center pb-4 border-b" style={{ borderColor: C.border }}>
            <p className="text-xl font-semibold" style={{ color: C.accent }}>Serasa Restaurant</p>
            <p className="text-sm mt-1" style={{ color: C.muted }}>Laporan Penjualan — {periodLabel}</p>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>Dicetak: {today}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Pesanan', value: filtered.length, sub: `${delivered} selesai` },
              { label: 'Total Pendapatan', value: formatPrice(totalRevenue), sub: 'semua status' },
              { label: 'Rata-rata/Pesanan', value: formatPrice(Math.round(avgOrder)), sub: 'per transaksi' },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-3 border text-center" style={{ background: C.bg, borderColor: C.border }}>
                <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: C.muted }}>{s.label}</p>
                <p className="font-bold text-base" style={{ color: C.accent }}>{s.value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Status breakdown */}
          <div>
            <p className="text-sm font-medium mb-3" style={{ color: C.text }}>Status Pesanan</p>
            <div className="grid grid-cols-4 gap-2">
              {(['pending', 'cooking', 'ready', 'delivered'] as OrderStatus[]).map(s => {
                const count = filtered.filter(o => o.status === s).length
                const cfg = STATUS_CONFIG[s]
                return (
                  <div key={s} className="rounded-lg p-3 border" style={{ background: C.bg, borderColor: C.border }}>
                    <p className="text-xl font-bold" style={{ color: count > 0 ? cfg.dot.replace('bg-', '') : C.muted }}>{count}</p>
                    <p className="text-[10px] mt-1" style={{ color: C.muted }}>{cfg.label}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top items */}
          {topItems.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: C.text }}>Menu Terlaris</p>
              <div className="space-y-1.5">
                {topItems.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                    style={{ background: C.bg }}>
                    <span className="text-xs font-bold w-5" style={{ color: C.accent }}>#{i + 1}</span>
                    <span className="text-sm flex-1" style={{ color: C.text }}>{item.name}</span>
                    <span className="text-xs" style={{ color: C.muted }}>{item.qty} porsi</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order table */}
          <div>
            <p className="text-sm font-medium mb-3" style={{ color: C.text }}>Daftar Pesanan ({filtered.length})</p>
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: C.border }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: C.bg, color: C.muted }}>
                    {['Meja','Customer','Item','Status','Total','Waktu'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-medium uppercase tracking-wider text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-3 py-6 text-center" style={{ color: C.muted }}>Tidak ada pesanan</td></tr>
                  ) : filtered.map((o, i) => (
                    <tr key={o.id} className="border-t" style={{ borderColor: C.border, background: i % 2 !== 0 ? `${C.bg}80` : 'transparent' }}>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: C.accent }}>Meja {o.table_number}</td>
                      <td className="px-3 py-2.5" style={{ color: C.text }}>{o.customer_name}</td>
                      <td className="px-3 py-2.5" style={{ color: C.muted }}>{o.order_items?.length ?? 0} item</td>
                      <td className="px-3 py-2.5"><StatusBadge status={o.status} /></td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: C.accent }}>{formatPrice(o.total_price)}</td>
                      <td className="px-3 py-2.5" style={{ color: C.muted }}>{formatTime(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2" style={{ borderColor: `${C.accent}30`, background: C.bg }}>
                      <td colSpan={4} className="px-3 py-2.5 text-xs font-semibold" style={{ color: C.muted }}>TOTAL</td>
                      <td className="px-3 py-2.5 font-bold" style={{ color: C.accent }}>
                        {formatPrice(filtered.reduce((s, o) => s + o.total_price, 0))}
                      </td>
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

// ── OrderCard ────────────────────────────────────────────────
function OrderCard({
  order, isNew, updating,
  onUpdate,
}: {
  order: Order; isNew: boolean; updating: boolean; onUpdate: () => void
}) {
  const cfg = STATUS_CONFIG[order.status]
  const next = NEXT_STATUS[order.status]

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
      style={{
        background: C.card,
        borderColor: isNew ? C.accent : C.border,
        boxShadow: isNew ? `0 0 0 1px ${C.accent}30` : undefined,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: C.border }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ background: `${C.accent}15`, color: C.accent }}>
            {order.table_number}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{order.customer_name}</p>
              {isNew && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: C.accent, color: '#000' }}>NEW</span>
              )}
            </div>
            <p className="text-xs" style={{ color: C.muted }}>
              Meja {order.table_number} · {new Date(order.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short' })} {formatTime(order.created_at)}
            </p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Order meta tags */}
      {(order.order_type || order.payment_method) && (
        <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
          {order.order_type && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{ background: `${C.accent}08`, borderColor: `${C.accent}20`, color: C.muted }}>
              {order.order_type === 'dine_in' ? '🍽 Dine In' : '🛍 Take Away'}
            </span>
          )}
          {order.payment_method && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{ background: `${C.accent}08`, borderColor: `${C.accent}20`, color: C.muted }}>
              {order.payment_method === 'cash' ? '💵 Tunai' : '📱 Online'}
            </span>
          )}
        </div>
      )}

      {/* Items */}
      <div className="px-4 py-3 space-y-2">
        {order.order_items?.map(item => (
          <div key={item.id} className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs" style={{ color: C.muted }}>
                <span style={{ color: C.text }}>{item.qty}×</span> {item.name}
              </p>
              {item.notes && (
                <p className="text-[10px] italic mt-0.5" style={{ color: '#555' }}>📝 {item.notes}</p>
              )}
            </div>
            <span className="text-xs font-medium flex-shrink-0" style={{ color: C.accent }}>
              {formatPrice(item.price * item.qty)}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 space-y-2.5">
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: C.border }}>
          <span className="text-xs" style={{ color: C.muted }}>
            {order.order_items?.length ?? 0} item
          </span>
          <div className="flex items-center gap-2">
            {/* Print invoice */}
            <button
              onClick={() => window.open(`/receipt/${order.id}?print=1`, '_blank')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors hover:bg-white/5"
              style={{ borderColor: C.border, color: C.muted }}
              title="Cetak Invoice"
            >
              <Printer size={11} /> Print
            </button>
            <span className="text-sm font-bold" style={{ color: C.text }}>
              {formatPrice(order.total_price)}
            </span>
          </div>
        </div>
        {next && cfg.btnLabel && (
          <button
            onClick={onUpdate}
            disabled={updating}
            className="w-full py-2 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-50 active:scale-[0.98]"
            style={updating ? { background: C.border, color: C.muted } : { background: 'transparent' }}
          >
            {updating ? (
              <span style={{ color: C.muted }}>Memproses...</span>
            ) : (
              <span className={cfg.btnClass}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: cfg.btnClass.includes('bg-[#EF4444]') ? '#EF4444' :
                               cfg.btnClass.includes('bg-[#22C55E]') ? '#22C55E' : '#6366F1',
                  color: '#fff',
                  padding: '6px 0', borderRadius: 8, width: '100%',
                }}
              >
                {cfg.btnLabel}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const { isRTL } = useLang()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [newOrderId, setNewOrderId] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    if (IS_MOCK_MODE) { setOrders(MOCK_ORDERS); setLoading(false); return }
    const { data } = await supabase
      .from('orders').select('*, order_items(*)')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('created_at', { ascending: false }).limit(100)
    if (data) setOrders(data as Order[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    const channel = supabase.channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        if (payload.eventType === 'INSERT') {
          setNewOrderId((payload.new as Order).id)
          setTimeout(() => setNewOrderId(null), 5000)
          fetchOrders()
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === (payload.new as Order).id ? { ...o, ...payload.new } : o))
        }
      }).subscribe()
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

  // Date filter
  const [dateFilter, setDateFilter] = useState<'today'|'week'|'month'|'all'>('today')
  const now = new Date()
  const dateFiltered = orders.filter(o => {
    const d = new Date(o.created_at)
    if (dateFilter === 'today') return d.toDateString() === now.toDateString()
    if (dateFilter === 'week')  return (now.getTime() - d.getTime()) < 7 * 86400000
    if (dateFilter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    return true
  })

  const filtered = (filter === 'all' ? dateFiltered : dateFiltered.filter(o => o.status === filter))
  const counts = {
    all: dateFiltered.length,
    pending: dateFiltered.filter(o => o.status === 'pending').length,
    cooking: dateFiltered.filter(o => o.status === 'cooking').length,
    ready: dateFiltered.filter(o => o.status === 'ready').length,
    delivered: dateFiltered.filter(o => o.status === 'delivered').length,
  }
  const todayRevenue = orders
    .filter(o => o.status === 'delivered' && new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((s, o) => s + o.total_price, 0)

  return (
    <div className="min-h-dvh font-body" dir={isRTL ? 'rtl' : 'ltr'} style={{ background: C.bg }}>
      {showReport && <ReportModal orders={orders} onClose={() => setShowReport(false)} />}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-60 border-r z-40 py-5"
        style={{ background: C.sidebar, borderColor: C.border }}>
        {/* Brand */}
        <div className="px-5 mb-6">
          <div className="relative w-[110px] h-[40px] mb-1">
            <Image src="/logo.png" alt="Serasa" fill className="object-contain object-left" sizes="110px" />
          </div>
          <p className="text-[11px]" style={{ color: C.muted }}>Restaurant Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          <SidebarItem icon={ClipboardList} label="Pesanan" active />
          <SidebarItem icon={UtensilsCrossed} label="Kelola Menu" onClick={() => router.push('/admin/menu')} />
          <SidebarItem icon={ChefHat} label="Kitchen Display" onClick={() => router.push('/kitchen')} />
          <SidebarItem icon={BarChart3} label="Laporan" onClick={() => setShowReport(true)} />
        </nav>

        {/* Status */}
        <div className="px-4 mt-4">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: C.bg }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <span className="text-[11px]" style={{ color: C.muted }}>Live · Realtime aktif</span>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="lg:ml-60">

        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b backdrop-blur-xl"
          style={{ background: `${C.bg}F0`, borderColor: C.border }}>
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="relative lg:hidden w-[80px] h-[28px]">
                <Image src="/logo.png" alt="Serasa" fill className="object-contain object-left" sizes="80px" />
              </div>
              <div>
                <h1 className="text-base font-semibold" style={{ color: C.text }}>Dashboard Pesanan</h1>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex lg:hidden gap-1.5">
                <button onClick={() => router.push('/admin/menu')}
                  className="p-2 rounded-lg border transition-colors hover:bg-white/5"
                  style={{ borderColor: C.border, color: C.muted }}>
                  <UtensilsCrossed size={15} />
                </button>
                <button onClick={() => setShowReport(true)}
                  className="p-2 rounded-lg border transition-colors hover:bg-white/5"
                  style={{ borderColor: C.border, color: C.muted }}>
                  <FileText size={15} />
                </button>
              </div>
              {newOrderId && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium animate-fade-in"
                  style={{ background: `${C.accent}15`, color: C.accent, border: `1px solid ${C.accent}30` }}>
                  <Bell size={12} className="animate-bounce" /> Pesanan baru!
                </div>
              )}
              <button onClick={fetchOrders}
                className="p-2 rounded-lg border transition-colors hover:bg-white/5"
                style={{ borderColor: C.border, color: C.muted }}>
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Date filter */}
          <div className="flex gap-1.5 px-4 lg:px-6 py-2 overflow-x-auto scrollbar-hide border-t" style={{ borderColor: C.border }}>
            {([['today','Hari Ini'],['week','7 Hari'],['month','Bulan Ini'],['all','Semua']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setDateFilter(val)}
                className="px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all"
                style={dateFilter === val
                  ? { background: C.accent, color: '#000' }
                  : { background: 'transparent', color: C.muted, border: `1px solid ${C.border}` }}>
                {label}
              </button>
            ))}
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-2 px-4 lg:px-6 py-2.5 overflow-x-auto scrollbar-hide border-t" style={{ borderColor: C.border }}>
            {[
              { value: 'all',       label: 'Semua' },
              { value: 'pending',   label: 'Pending' },
              { value: 'cooking',   label: 'Cooking' },
              { value: 'ready',     label: 'Ready' },
              { value: 'delivered', label: 'Delivered' },
            ].map(tab => (
              <FilterTab
                key={tab.value}
                label={tab.label}
                count={counts[tab.value as keyof typeof counts]}
                active={filter === tab.value}
                onClick={() => setFilter(tab.value)}
              />
            ))}
          </div>
        </header>

        <main className="px-4 lg:px-6 py-5 space-y-5 pb-10">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={ShoppingBag}    label="Total Pesanan"     value={counts.all}               color={C.accent} />
            <StatCard icon={TrendingUp}     label="Pendapatan Hari Ini" value={formatPrice(todayRevenue)} color={C.success} />
            <StatCard icon={AlertCircle}    label="Pending"          value={counts.pending}            color={C.warning}
              sub={counts.pending > 0 ? 'Menunggu diproses' : 'Semua clear'} />
            <StatCard icon={CheckCircle2}   label="Selesai"          value={counts.delivered}          color="#6366F1"
              sub="Hari ini" />
          </div>

          {/* Orders grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-52 rounded-xl animate-pulse" style={{ background: C.card }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <ClipboardList size={24} style={{ color: C.muted }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: C.text }}>Tidak ada pesanan</p>
              <p className="text-xs" style={{ color: C.muted }}>Pesanan akan muncul di sini secara realtime</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isNew={order.id === newOrderId}
                  updating={updating === order.id}
                  onUpdate={() => updateStatus(order.id, order.status)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
