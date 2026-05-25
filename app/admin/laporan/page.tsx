'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeft, TrendingUp, ShoppingBag, Receipt,
  Download, Printer, RefreshCw, QrCode, Monitor,
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

type Period = 'today' | '7d' | '30d'

const PLATFORM_CFG: Record<string, { label: string; color: string }> = {
  pos:          { label: 'Kasir (POS)',   color: '#6366F1' },
  qr:           { label: 'QR Scan',       color: '#FF6B35' },
  hungerstation:{ label: 'HungerStation', color: '#FF6000' },
  keeta:        { label: 'Keeta',         color: '#00C851' },
}

function getPlatformLabel(source: string | null | undefined) {
  return PLATFORM_CFG[source ?? 'pos']?.label ?? 'Kasir (POS)'
}
function getPlatformColor(source: string | null | undefined) {
  return PLATFORM_CFG[source ?? 'pos']?.color ?? '#6366F1'
}

function periodStart(p: Period): Date {
  const d = new Date()
  if (p === 'today') { d.setHours(0, 0, 0, 0); return d }
  if (p === '7d')  { d.setDate(d.getDate() - 6); d.setHours(0,0,0,0); return d }
  d.setDate(d.getDate() - 29); d.setHours(0,0,0,0); return d
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

function exportCSV(orders: Order[]) {
  const header = ['No. Order', 'Tanggal', 'Nama', 'Meja', 'Platform', 'Status', 'Item', 'Total']
  const rows = orders.map(o => [
    o.order_number ?? '-',
    new Date(o.created_at).toLocaleString('id-ID'),
    o.customer_name,
    o.order_type === 'delivery' ? 'Delivery' : `Meja ${o.table_number}`,
    getPlatformLabel(o.source),
    o.status,
    o.order_items?.map(i => `${i.qty}x ${i.name}`).join(' | ') ?? '',
    o.total_price,
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `laporan-serasa-${new Date().toISOString().slice(0,10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

// ── Simple CSS bar chart ────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-[9px] font-bold" style={{ color: C.muted }}>
            {d.value > 0 ? formatPrice(d.value).replace('SR ', '') : ''}
          </span>
          <div className="w-full rounded-t-sm transition-all" style={{
            height: `${Math.max((d.value / max) * 88, d.value > 0 ? 4 : 0)}px`,
            background: d.color,
            opacity: 0.85,
          }} />
          <span className="text-[8px] text-center leading-tight w-full truncate"
            style={{ color: C.muted }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function LaporanPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('today')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const from = periodStart(period).toISOString()
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', RESTAURANT_ID)
      .neq('status', 'cancelled')
      .gte('created_at', from)
      .order('created_at', { ascending: false })
    setOrders((data as Order[]) ?? [])
    setLoading(false)
  }, [period])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // ── Aggregations ────────────────────────────────────────────
  const totalRevenue = orders.reduce((s, o) => s + o.total_price, 0)
  const totalOrders  = orders.length
  const avgOrder     = totalOrders ? Math.round(totalRevenue / totalOrders) : 0
  const deliveredCount = orders.filter(o => o.status === 'delivered').length

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
    .map(([src, v]) => ({
      label: PLATFORM_CFG[src]?.label ?? src,
      color: PLATFORM_CFG[src]?.color ?? '#888',
      revenue: v.revenue,
      count: v.count,
    }))

  // Revenue trend (by day)
  const dayMap: Record<string, number> = {}
  orders.forEach(o => {
    const day = new Date(o.created_at).toISOString().slice(0, 10)
    dayMap[day] = (dayMap[day] ?? 0) + o.total_price
  })
  const days = period === 'today' ? 1 : period === '7d' ? 7 : 30
  const trendData = Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i)); d.setHours(0,0,0,0)
    const key = d.toISOString().slice(0, 10)
    return { label: formatDay(d.toISOString()), value: dayMap[key] ?? 0, color: C.accent }
  })

  // Top items
  const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {}
  orders.forEach(o => {
    o.order_items?.forEach(i => {
      if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, qty: 0, revenue: 0 }
      itemMap[i.name].qty += i.qty
      itemMap[i.name].revenue += i.price * i.qty
    })
  })
  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 10)

  const periodLabel = { today: 'Hari Ini', '7d': '7 Hari Terakhir', '30d': '30 Hari Terakhir' }[period]

  return (
    <div className="min-h-dvh" style={{ background: C.bg, color: C.text }}>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b px-6 py-4 flex items-center justify-between no-print"
        style={{ background: C.bg2, borderColor: C.border }}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
            style={{ color: C.muted }}>
            <ArrowLeft size={16} />
          </button>
          <div className="relative w-[80px] h-[28px]">
            <Image src="/logof22.png" alt="Serasa" fill className="object-contain object-left" sizes="80px" />
          </div>
          <div className="h-4 w-px" style={{ background: C.border }} />
          <div>
            <p className="font-bold text-sm" style={{ color: C.text }}>Laporan Harian</p>
            <p className="text-[10px]" style={{ color: C.muted }}>{periodLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Period tabs */}
          <div className="flex gap-1 p-1 rounded-lg border" style={{ background: C.bg, borderColor: C.border }}>
            {([['today','Hari Ini'],['7d','7 Hari'],['30d','30 Hari']] as [Period,string][]).map(([p, l]) => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={period === p ? { background: C.accent, color: '#000' } : { color: C.muted }}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={fetchOrders}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
            style={{ color: C.muted }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => exportCSV(orders)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: '#16A34A', color: 'white' }}>
            <Download size={13} /> Export CSV
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: C.accent, color: '#000' }}>
            <Printer size={13} /> Print
          </button>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: TrendingUp, label: 'Total Pendapatan', value: formatPrice(totalRevenue), sub: `${totalOrders} pesanan`, color: C.accent },
            { icon: ShoppingBag, label: 'Total Pesanan', value: totalOrders, sub: `${deliveredCount} selesai`, color: '#6366F1' },
            { icon: Receipt, label: 'Rata-rata/Pesanan', value: formatPrice(avgOrder), sub: 'per transaksi', color: '#22C55E' },
            { icon: QrCode, label: 'Platform Terlaris', value: platformData[0]?.label ?? '–', sub: platformData[0] ? `${platformData[0].count} order` : '', color: '#F59E0B' },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="rounded-xl border p-4" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium" style={{ color: C.muted }}>{label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                  <Icon size={15} style={{ color }} />
                </div>
              </div>
              <p className="text-xl font-bold truncate" style={{ color: C.text }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: C.muted }}>{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Revenue trend */}
          <div className="lg:col-span-2 rounded-xl border p-5" style={{ background: C.card, borderColor: C.border }}>
            <p className="text-sm font-semibold mb-4" style={{ color: C.text }}>
              Tren Pendapatan
              {period === 'today' && <span className="text-xs font-normal ml-2" style={{ color: C.muted }}>Hari Ini</span>}
            </p>
            {loading ? (
              <div className="h-32 rounded-lg animate-pulse" style={{ background: C.bg }} />
            ) : trendData.length <= 1 ? (
              <div className="h-32 flex items-center justify-center">
                <p className="text-sm" style={{ color: C.muted }}>
                  {formatPrice(totalRevenue)} — {totalOrders} pesanan hari ini
                </p>
              </div>
            ) : (
              <BarChart data={trendData} />
            )}
          </div>

          {/* Platform breakdown */}
          <div className="rounded-xl border p-5" style={{ background: C.card, borderColor: C.border }}>
            <p className="text-sm font-semibold mb-4" style={{ color: C.text }}>Per Platform</p>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: C.bg }} />
                ))}
              </div>
            ) : platformData.length === 0 ? (
              <p className="text-sm" style={{ color: C.muted }}>Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {platformData.map(p => (
                  <div key={p.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                        <span className="text-xs font-medium" style={{ color: C.text }}>{p.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold" style={{ color: p.color }}>
                          {formatPrice(p.revenue)}
                        </span>
                        <span className="text-[10px] ml-1.5" style={{ color: C.muted }}>
                          {p.count} order
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.bg }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${(p.revenue / totalRevenue) * 100}%`, background: p.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Top items */}
          <div className="rounded-xl border p-5" style={{ background: C.card, borderColor: C.border }}>
            <p className="text-sm font-semibold mb-4" style={{ color: C.text }}>Menu Terlaris</p>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-7 rounded animate-pulse" style={{ background: C.bg }} />
                ))}
              </div>
            ) : topItems.length === 0 ? (
              <p className="text-sm" style={{ color: C.muted }}>Belum ada data</p>
            ) : (
              <div className="space-y-2">
                {topItems.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                    style={{ background: C.bg }}>
                    <span className="text-xs font-black w-5 text-center flex-shrink-0"
                      style={{ color: i < 3 ? C.accent : C.muted }}>
                      #{i + 1}
                    </span>
                    <span className="text-xs flex-1 truncate" style={{ color: C.text }}>{item.name}</span>
                    <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: C.muted }}>
                      {item.qty}x
                    </span>
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
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
              <p className="text-sm font-semibold" style={{ color: C.text }}>
                Daftar Pesanan
                <span className="ml-2 text-xs font-normal" style={{ color: C.muted }}>({totalOrders})</span>
              </p>
            </div>
            <div className="overflow-auto max-h-96">
              <table className="w-full text-xs">
                <thead className="sticky top-0" style={{ background: C.bg }}>
                  <tr>
                    {['No. Order','Waktu','Nama','Platform','Status','Total'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium text-[10px] uppercase tracking-wider"
                        style={{ color: C.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center" style={{ color: C.muted }}>
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw size={14} className="animate-spin" />Memuat...
                      </div>
                    </td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center" style={{ color: C.muted }}>
                      Tidak ada pesanan
                    </td></tr>
                  ) : orders.map((o, i) => (
                    <tr key={o.id} className="border-t transition-colors hover:bg-white/5"
                      style={{ borderColor: C.border, background: i % 2 !== 0 ? `${C.bg}60` : 'transparent' }}>
                      <td className="px-4 py-2.5 font-mono" style={{ color: C.accent }}>
                        {o.order_number ?? '–'}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: C.muted }}>
                        {new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: C.text }}>{o.customer_name}</td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit"
                          style={{
                            background: `${getPlatformColor(o.source)}20`,
                            color: getPlatformColor(o.source),
                          }}>
                          {o.source === 'qr' && <QrCode size={9} />}
                          {o.source === 'pos' || !o.source ? <Monitor size={9} /> : null}
                          {getPlatformLabel(o.source)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-semibold capitalize" style={{
                          color: o.status === 'delivered' ? '#22C55E' : o.status === 'cancelled' ? '#EF4444' : C.muted,
                        }}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-semibold" style={{ color: C.accent }}>
                        {formatPrice(o.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {orders.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2" style={{ borderColor: `${C.accent}30`, background: C.bg }}>
                      <td colSpan={5} className="px-4 py-2.5 text-xs font-semibold" style={{ color: C.muted }}>
                        TOTAL {totalOrders} pesanan
                      </td>
                      <td className="px-4 py-2.5 font-bold" style={{ color: C.accent }}>
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
