'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeft, TrendingUp, ShoppingBag, Receipt,
  Download, Printer, RefreshCw, QrCode, Monitor,
  UtensilsCrossed, Bike, Clock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { Order } from '@/types'

const C = {
  bg:     '#0F1115',
  card:   '#171A21',
  border: '#23262F',
  accent: '#F0A030',
  text:   '#FFFFFF',
  muted:  '#A1A1AA',
  bg2:    '#13161C',
}
const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

type Period = 'today' | 'kemarin' | '7d' | 'bulan_ini' | '30d'

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: 'today',     label: 'Hari Ini'  },
  { key: 'kemarin',   label: 'Kemarin'   },
  { key: '7d',        label: '7 Hari'    },
  { key: 'bulan_ini', label: 'Bulan Ini' },
  { key: '30d',       label: '30 Hari'   },
]

const PLATFORM_CFG: Record<string, { label: string; color: string }> = {
  pos:           { label: 'Kasir (POS)',    color: '#6366F1' },
  qr:            { label: 'QR Scan',        color: '#FF6B35' },
  hungerstation: { label: 'HungerStation',  color: '#FF6000' },
  keeta:         { label: 'Keeta',          color: '#00C851' },
}
const ORDER_TYPE_CFG: Record<string, { label: string; color: string }> = {
  dine_in:   { label: 'Dine-In',   color: '#6366F1' },
  take_away: { label: 'Take Away', color: '#F59E0B' },
  delivery:  { label: 'Delivery',  color: '#22C55E' },
}
const ORDER_TYPE_ICON = {
  dine_in:   UtensilsCrossed,
  take_away: ShoppingBag,
  delivery:  Bike,
} as const
type OrderTypeKey = keyof typeof ORDER_TYPE_ICON

const OPERATION_HOURS = Array.from({ length: 14 }, (_, i) => i + 10) // 10–23

function getPlatformLabel(src?: string | null) { return PLATFORM_CFG[src ?? 'pos']?.label ?? 'Kasir (POS)' }
function getPlatformColor(src?: string | null) { return PLATFORM_CFG[src ?? 'pos']?.color ?? '#6366F1' }

function periodRange(p: Period): { from: Date; to: Date } {
  const now = new Date()
  if (p === 'today') {
    const from = new Date(now); from.setHours(0, 0, 0, 0)
    return { from, to: now }
  }
  if (p === 'kemarin') {
    const from = new Date(now); from.setDate(from.getDate() - 1); from.setHours(0, 0, 0, 0)
    const to   = new Date(now); to.setHours(0, 0, 0, 0)
    return { from, to }
  }
  if (p === '7d') {
    const from = new Date(now); from.setDate(from.getDate() - 6); from.setHours(0, 0, 0, 0)
    return { from, to: now }
  }
  if (p === 'bulan_ini') {
    const from = new Date(now); from.setDate(1); from.setHours(0, 0, 0, 0)
    return { from, to: now }
  }
  // 30d
  const from = new Date(now); from.setDate(from.getDate() - 29); from.setHours(0, 0, 0, 0)
  return { from, to: now }
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

function exportCSV(orders: Order[]) {
  const header = ['No. Order', 'Tanggal', 'Nama', 'Meja', 'Platform', 'Tipe', 'Status', 'Total']
  const rows = orders.map(o => [
    o.order_number ?? '-',
    new Date(o.created_at).toLocaleString('id-ID'),
    o.customer_name,
    o.order_type === 'delivery' ? 'Delivery' : `Meja ${o.table_number}`,
    getPlatformLabel(o.source),
    o.order_type ?? 'dine_in',
    o.status,
    o.total_price,
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href = url
  a.download = `laporan-serasa-${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

// ── Simple daily bar chart ──────────────────────────────────────
function DayChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1 h-28">
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-[8px] font-bold" style={{ color: C.muted }}>
            {d.value > 0 ? formatPrice(d.value).replace(' SAR', '') : ''}
          </span>
          <div className="w-full rounded-t-sm transition-all duration-500"
            style={{ height: `${Math.max((d.value / max) * 80, d.value > 0 ? 3 : 0)}px`, background: d.color, opacity: 0.85 }} />
          <span className="text-[8px] text-center leading-tight w-full truncate" style={{ color: C.muted }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Peak hours chart ──────────────────────────────────────────
function PeakHoursChart({
  data, peakHour, loading,
}: {
  data: { hour: number; label: string; count: number; revenue: number }[]
  peakHour: number
  loading: boolean
}) {
  const maxCount = Math.max(...data.map(d => d.count), 1)
  const currentHour = new Date().getHours()

  if (loading) return <div className="h-36 rounded-lg animate-pulse" style={{ background: C.bg }} />

  return (
    <div>
      <div className="flex items-end gap-1 h-36">
        {data.map(d => {
          const isPeak    = d.hour === peakHour && d.count > 0
          const isCurrent = d.hour === currentHour
          const barColor  = isPeak ? C.accent : isCurrent ? '#818CF8' : '#334155'
          const barH      = Math.max((d.count / maxCount) * 100, d.count > 0 ? 6 : 0)
          return (
            <div key={d.hour} className="flex-1 flex flex-col items-center gap-0.5 min-w-0 group relative">
              {/* Revenue tooltip on hover */}
              {d.count > 0 && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                  <div className="rounded-lg px-2 py-1 text-[9px] font-bold whitespace-nowrap"
                    style={{ background: C.card, border: `1px solid ${C.border}`, color: C.accent }}>
                    {formatPrice(d.revenue)}
                  </div>
                  <div className="w-1.5 h-1.5 rotate-45 -mt-1" style={{ background: C.card, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }} />
                </div>
              )}
              {/* Count label */}
              <span className="text-[9px] font-black" style={{ color: isPeak ? C.accent : d.count > 0 ? C.muted : 'transparent' }}>
                {d.count || ''}
              </span>
              {/* Bar */}
              <div className="w-full rounded-t-sm transition-all duration-500"
                style={{ height: `${barH}px`, background: barColor, minHeight: d.count > 0 ? 4 : 0 }} />
              {/* Hour label */}
              <span className="text-[8px]" style={{ color: isPeak ? C.accent : C.muted }}>
                {d.hour}
              </span>
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: C.accent }} />
          <span className="text-[10px]" style={{ color: C.muted }}>Jam Tersibuk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#818CF8' }} />
          <span className="text-[10px]" style={{ color: C.muted }}>Jam Sekarang</span>
        </div>
        <span className="text-[10px] ml-auto" style={{ color: C.muted }}>hover bar = lihat revenue</span>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────
export default function LaporanPage() {
  const router = useRouter()
  const [period, setPeriod]   = useState<Period>('today')
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const { from, to } = periodRange(period)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', RESTAURANT_ID)
      .neq('status', 'cancelled')
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())
      .order('created_at', { ascending: false })
    setOrders((data as Order[]) ?? [])
    setLoading(false)
  }, [period])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // ── Aggregations ────────────────────────────────────────────
  const totalRevenue    = orders.reduce((s, o) => s + o.total_price, 0)
  const totalOrders     = orders.length
  const avgOrder        = totalOrders ? Math.round(totalRevenue / totalOrders) : 0
  const deliveredCount  = orders.filter(o => o.status === 'delivered').length

  // Platform breakdown
  const platformMap: Record<string, { revenue: number; count: number }> = {}
  orders.forEach(o => {
    const src = o.source ?? 'pos'
    if (!platformMap[src]) platformMap[src] = { revenue: 0, count: 0 }
    platformMap[src].revenue += o.total_price
    platformMap[src].count++
  })
  const platformData = Object.entries(platformMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([src, v]) => ({ label: PLATFORM_CFG[src]?.label ?? src, color: PLATFORM_CFG[src]?.color ?? '#888', ...v }))

  // Revenue trend by day
  const dayMap: Record<string, number> = {}
  orders.forEach(o => {
    const day = new Date(o.created_at).toISOString().slice(0, 10)
    dayMap[day] = (dayMap[day] ?? 0) + o.total_price
  })
  const days = period === 'today' || period === 'kemarin' ? 1 : period === '7d' ? 7 : period === 'bulan_ini' ? new Date().getDate() : 30
  const { from: trendFrom } = periodRange(period)
  const trendData = Array.from({ length: days }, (_, i) => {
    const d = new Date(trendFrom); d.setDate(trendFrom.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    return { label: formatDay(d.toISOString()), value: dayMap[key] ?? 0, color: C.accent }
  })

  // Peak hours (10–23)
  const hourlyMap: Record<number, { count: number; revenue: number }> = {}
  OPERATION_HOURS.forEach(h => { hourlyMap[h] = { count: 0, revenue: 0 } })
  orders.forEach(o => {
    const h = new Date(o.created_at).getHours()
    if (h >= 10 && h <= 23) { hourlyMap[h].count++; hourlyMap[h].revenue += o.total_price }
  })
  const peakData = OPERATION_HOURS.map(h => ({ hour: h, label: `${h}`, ...hourlyMap[h] }))
  const peakHour = peakData.reduce((max, d) => d.count > max.count ? d : max, peakData[0]).hour
  const peakCount = hourlyMap[peakHour]?.count ?? 0

  // Order type breakdown
  const typeMap: Record<string, { count: number; revenue: number }> = {
    dine_in: { count: 0, revenue: 0 }, take_away: { count: 0, revenue: 0 }, delivery: { count: 0, revenue: 0 },
  }
  orders.forEach(o => {
    const t = (o.order_type as string) ?? 'dine_in'
    if (!typeMap[t]) typeMap[t] = { count: 0, revenue: 0 }
    typeMap[t].count++; typeMap[t].revenue += o.total_price
  })

  // Top items — exclude cancelled order_items
  const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {}
  orders.forEach(o => o.order_items?.filter(i => !i.cancelled).forEach(i => {
    if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, qty: 0, revenue: 0 }
    itemMap[i.name].qty += i.qty; itemMap[i.name].revenue += i.price * i.qty
  }))
  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 10)

  const periodLabel = PERIOD_OPTIONS.find(p => p.key === period)?.label ?? ''

  return (
    <div className="min-h-dvh" style={{ background: C.bg, color: C.text }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b no-print"
        style={{ background: C.bg2, borderColor: C.border }}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6 py-3">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ color: C.muted }}>
              <ArrowLeft size={16} />
            </button>
            <div className="relative w-[72px] h-[26px]">
              <Image src="/logof22.png" alt="Serasa" fill className="object-contain object-left" sizes="72px" />
            </div>
            <div className="h-4 w-px" style={{ background: C.border }} />
            <div>
              <p className="font-bold text-sm" style={{ color: C.text }}>Sales Report</p>
              <p className="text-[10px]" style={{ color: C.muted }}>{periodLabel}</p>
            </div>
          </div>

          {/* Period tabs */}
          <div className="flex gap-0.5 p-1 rounded-lg border" style={{ background: C.bg, borderColor: C.border }}>
            {PERIOD_OPTIONS.map(({ key, label }) => (
              <button key={key} onClick={() => setPeriod(key)}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap"
                style={period === key ? { background: C.accent, color: '#000' } : { color: C.muted }}>
                {label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={fetchOrders}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ color: C.muted }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => exportCSV(orders)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: '#16A34A', color: 'white' }}>
              <Download size={13} /> CSV
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: C.accent, color: '#000' }}>
              <Printer size={13} /> Print
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">

        {/* ── KPI Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: TrendingUp,  label: 'Total Pendapatan',  value: formatPrice(totalRevenue),  sub: `${totalOrders} pesanan`,       color: C.accent  },
            { icon: ShoppingBag, label: 'Total Order',       value: String(totalOrders),        sub: `${deliveredCount} selesai`,    color: '#6366F1' },
            { icon: Receipt,     label: 'Rata-rata/Order',   value: formatPrice(avgOrder),      sub: 'per transaksi',                color: '#22C55E' },
            { icon: Clock,       label: 'Jam Tersibuk',
              value: peakCount > 0 ? `${peakHour}:00` : '–',
              sub: peakCount > 0 ? `${peakCount} order` : 'belum ada data',
              color: '#F59E0B' },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="rounded-xl border p-4" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium leading-tight" style={{ color: C.muted }}>{label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                  <Icon size={14} style={{ color }} />
                </div>
              </div>
              <p className="text-lg font-bold truncate leading-tight" style={{ color: C.text }}>{value}</p>
              <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Row 1: Trend + Platform ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Revenue trend */}
          <div className="lg:col-span-2 rounded-xl border p-5" style={{ background: C.card, borderColor: C.border }}>
            <p className="text-sm font-semibold mb-4" style={{ color: C.text }}>Tren Pendapatan</p>
            {loading ? (
              <div className="h-28 rounded-lg animate-pulse" style={{ background: C.bg }} />
            ) : trendData.length <= 1 ? (
              <div className="h-28 flex flex-col items-center justify-center gap-1">
                <p className="text-2xl font-black" style={{ color: C.accent }}>{formatPrice(totalRevenue)}</p>
                <p className="text-sm" style={{ color: C.muted }}>{totalOrders} pesanan {periodLabel.toLowerCase()}</p>
              </div>
            ) : (
              <DayChart data={trendData} />
            )}
          </div>

          {/* Platform breakdown */}
          <div className="rounded-xl border p-5" style={{ background: C.card, borderColor: C.border }}>
            <p className="text-sm font-semibold mb-4" style={{ color: C.text }}>Per Platform</p>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: C.bg }} />)}</div>
            ) : platformData.length === 0 ? (
              <p className="text-sm" style={{ color: C.muted }}>Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {platformData.map(p => (
                  <div key={p.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span className="text-xs font-medium" style={{ color: C.text }}>{p.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold" style={{ color: p.color }}>{formatPrice(p.revenue)}</span>
                        <span className="text-[10px] ml-1.5" style={{ color: C.muted }}>{p.count} order</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.bg }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0}%`, background: p.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Row 2: Peak Hours + Order Type ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Peak hours */}
          <div className="lg:col-span-2 rounded-xl border p-5" style={{ background: C.card, borderColor: C.border }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: C.text }}>Jam Tersibuk</p>
                <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>Jumlah order per jam operasional (10:00–23:00)</p>
              </div>
              {peakCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: `${C.accent}15`, border: `1px solid ${C.accent}30` }}>
                  <Clock size={12} style={{ color: C.accent }} />
                  <span className="text-xs font-bold" style={{ color: C.accent }}>
                    {peakHour}:00 — {peakCount} order
                  </span>
                </div>
              )}
            </div>
            <PeakHoursChart data={peakData} peakHour={peakHour} loading={loading} />
          </div>

          {/* Order type */}
          <div className="rounded-xl border p-5" style={{ background: C.card, borderColor: C.border }}>
            <p className="text-sm font-semibold mb-4" style={{ color: C.text }}>Tipe Order</p>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: C.bg }} />)}</div>
            ) : totalOrders === 0 ? (
              <p className="text-sm" style={{ color: C.muted }}>Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(ORDER_TYPE_CFG).map(([key, cfg]) => {
                  const Icon = ORDER_TYPE_ICON[key as OrderTypeKey] ?? UtensilsCrossed
                  const d = typeMap[key] ?? { count: 0, revenue: 0 }
                  const pct = totalOrders > 0 ? Math.round((d.count / totalOrders) * 100) : 0
                  return (
                    <div key={key} className="rounded-xl p-3" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${cfg.color}18` }}>
                          <Icon size={13} style={{ color: cfg.color }} />
                        </div>
                        <span className="text-xs font-semibold flex-1" style={{ color: C.text }}>{cfg.label}</span>
                        <span className="text-xs font-black" style={{ color: cfg.color }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: C.border }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: C.muted }}>{d.count} order</span>
                        <span className="text-[10px] font-semibold" style={{ color: C.muted }}>{formatPrice(d.revenue)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Row 3: Top Items + Order Table ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Top items */}
          <div className="rounded-xl border p-5" style={{ background: C.card, borderColor: C.border }}>
            <p className="text-sm font-semibold mb-4" style={{ color: C.text }}>Menu Terlaris</p>
            {loading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-7 rounded animate-pulse" style={{ background: C.bg }} />)}</div>
            ) : topItems.length === 0 ? (
              <p className="text-sm" style={{ color: C.muted }}>Belum ada data</p>
            ) : (
              <div className="space-y-1.5">
                {topItems.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ background: C.bg }}>
                    <span className="text-xs font-black w-4 text-center flex-shrink-0"
                      style={{ color: i < 3 ? C.accent : C.muted }}>
                      #{i + 1}
                    </span>
                    <span className="text-xs flex-1 truncate" style={{ color: C.text }}>{item.name}</span>
                    <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: C.muted }}>{item.qty}×</span>
                    <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: C.accent }}>
                      {formatPrice(item.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order table */}
          <div className="lg:col-span-2 rounded-xl border overflow-hidden" style={{ background: C.card, borderColor: C.border }}>
            <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
              <p className="text-sm font-semibold" style={{ color: C.text }}>
                Daftar Pesanan
                <span className="ml-2 text-xs font-normal" style={{ color: C.muted }}>({totalOrders})</span>
              </p>
            </div>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-xs">
                <thead className="sticky top-0" style={{ background: C.bg }}>
                  <tr>
                    {['No. Order', 'Waktu', 'Nama', 'Platform', 'Tipe', 'Status', 'Total'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-medium text-[10px] uppercase tracking-wider whitespace-nowrap"
                        style={{ color: C.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center" style={{ color: C.muted }}>
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw size={14} className="animate-spin" /> Memuat...
                      </div>
                    </td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center" style={{ color: C.muted }}>Tidak ada pesanan</td></tr>
                  ) : orders.map((o, i) => {
                    const typeCfg = ORDER_TYPE_CFG[(o.order_type as string) ?? 'dine_in'] ?? ORDER_TYPE_CFG.dine_in
                    return (
                      <tr key={o.id} className="border-t transition-colors hover:bg-white/5"
                        style={{ borderColor: C.border, background: i % 2 !== 0 ? `${C.bg}60` : 'transparent' }}>
                        <td className="px-3 py-2.5 font-mono whitespace-nowrap" style={{ color: C.accent }}>
                          {o.order_number ?? '–'}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.muted }}>
                          {new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-3 py-2.5 max-w-[120px] truncate" style={{ color: C.text }}>{o.customer_name}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${getPlatformColor(o.source)}20`, color: getPlatformColor(o.source) }}>
                            {getPlatformLabel(o.source)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-semibold" style={{ color: typeCfg.color }}>
                            {typeCfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-semibold capitalize"
                            style={{ color: o.status === 'delivered' ? '#22C55E' : o.status === 'cancelled' ? '#EF4444' : C.muted }}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-semibold whitespace-nowrap" style={{ color: C.accent }}>
                          {formatPrice(o.total_price)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {orders.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2" style={{ borderColor: `${C.accent}30`, background: C.bg }}>
                      <td colSpan={6} className="px-3 py-2.5 text-xs font-semibold" style={{ color: C.muted }}>
                        TOTAL {totalOrders} pesanan
                      </td>
                      <td className="px-3 py-2.5 font-bold" style={{ color: C.accent }}>
                        {formatPrice(totalRevenue)}
                      </td>
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
          body * { visibility: hidden !important; }
          body { background: white !important; }
          .no-print { display: none !important; }
          main, main * { visibility: visible !important; }
          main { position: absolute; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}
