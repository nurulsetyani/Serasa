'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Users, Clock, CheckCircle, UtensilsCrossed } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice, formatTime } from '@/lib/utils'
import { Order } from '@/types'

const C = {
  bg:     '#0F1115',
  card:   '#171A21',
  border: '#23262F',
  accent: '#FF6B35',
  text:   '#FFFFFF',
  muted:  '#A1A1AA',
  bg2:    '#13161C',
}
const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!
const TOTAL_TABLES  = 8

type TableStatus = 'kosong' | 'terisi' | 'tagihan'

const STATUS_CFG: Record<TableStatus, { label: string; color: string; icon: typeof Clock }> = {
  kosong:  { label: 'Kosong',           color: '#22C55E', icon: UtensilsCrossed },
  terisi:  { label: 'Terisi',           color: '#F59E0B', icon: Clock           },
  tagihan: { label: 'Tagihan Menunggu', color: '#EF4444', icon: CheckCircle     },
}

interface TableInfo {
  number:       number
  status:       TableStatus
  orders:       Order[]
  customerName?: string
  total:        number
  since?:       string
}

function deriveStatus(orders: Order[]): TableStatus {
  if (!orders.length) return 'kosong'
  return orders.some(o => ['new', 'pending', 'cooking'].includes(o.status))
    ? 'terisi'
    : 'tagihan'
}

export default function TablesPage() {
  const router  = useRouter()
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('id, table_number, customer_name, status, total_price, order_type, created_at, order_items(*)')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('order_type', 'dine_in')
      .in('status', ['new', 'pending', 'cooking', 'ready'])
      .order('created_at', { ascending: true })
    setOrders((data as Order[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    const ch = supabase.channel('admin-tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchOrders])

  const tables: TableInfo[] = Array.from({ length: TOTAL_TABLES }, (_, i) => {
    const n   = i + 1
    const ord = orders.filter(o => o.table_number === String(n))
    return {
      number:       n,
      status:       deriveStatus(ord),
      orders:       ord,
      customerName: ord[0]?.customer_name,
      total:        ord.reduce((s, o) => s + o.total_price, 0),
      since:        ord[0]?.created_at,
    }
  })

  const counts = {
    kosong:  tables.filter(t => t.status === 'kosong').length,
    terisi:  tables.filter(t => t.status === 'terisi').length,
    tagihan: tables.filter(t => t.status === 'tagihan').length,
  }

  return (
    <div className="min-h-dvh" style={{ background: C.bg, color: C.text }}>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b px-4 lg:px-6 py-4 flex items-center justify-between"
        style={{ background: C.bg2, borderColor: C.border }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
            style={{ color: C.muted }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="font-bold text-sm" style={{ color: C.text }}>Manajemen Meja</p>
            <p className="text-[10px]" style={{ color: C.muted }}>
              {counts.kosong} kosong · {counts.terisi} terisi · {counts.tagihan} tagihan
            </p>
          </div>
        </div>
        <button onClick={fetchOrders}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          style={{ color: C.muted }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="p-4 lg:p-6 max-w-4xl mx-auto">

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(Object.entries(STATUS_CFG) as [TableStatus, typeof STATUS_CFG[TableStatus]][]).map(([key, cfg]) => {
            const Icon = cfg.icon
            return (
              <div key={key} className="rounded-xl border p-4 flex items-center gap-3"
                style={{ background: C.card, borderColor: `${cfg.color}30` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cfg.color}15` }}>
                  <Icon size={16} style={{ color: cfg.color }} />
                </div>
                <div>
                  <p className="text-2xl font-black" style={{ color: cfg.color }}>
                    {counts[key]}
                  </p>
                  <p className="text-[10px] font-medium" style={{ color: C.muted }}>{cfg.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Table grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tables.map(t => {
            const cfg  = STATUS_CFG[t.status]
            const Icon = cfg.icon
            return (
              <div key={t.number}
                className="rounded-2xl border overflow-hidden transition-all duration-200"
                style={{
                  background:   C.card,
                  borderColor:  `${cfg.color}35`,
                  boxShadow:    t.status !== 'kosong' ? `0 4px 20px ${cfg.color}18` : 'none',
                }}>

                {/* Status bar */}
                <div className="h-1.5" style={{ background: cfg.color }} />

                <div className="p-4">
                  {/* Table number + status */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: C.muted }}>Meja</p>
                      <p className="font-black text-3xl leading-none mt-0.5"
                        style={{ color: C.text }}>{t.number}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                      style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}35` }}>
                      <Icon size={10} style={{ color: cfg.color }} />
                      <span className="text-[9px] font-black uppercase tracking-wide"
                        style={{ color: cfg.color }}>{cfg.label}</span>
                    </div>
                  </div>

                  {/* Order details */}
                  {t.status === 'kosong' ? (
                    <div className="flex items-center gap-2 py-2">
                      <UtensilsCrossed size={14} style={{ color: C.muted }} />
                      <p className="text-xs" style={{ color: C.muted }}>Tidak ada pesanan</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Customer */}
                      <div className="flex items-center gap-2">
                        <Users size={11} style={{ color: C.muted }} />
                        <p className="text-xs font-semibold truncate" style={{ color: C.text }}>
                          {t.customerName ?? 'Guest'}
                        </p>
                      </div>

                      {/* Order count + since */}
                      <div className="flex items-center gap-2">
                        <Clock size={11} style={{ color: C.muted }} />
                        <p className="text-[10px]" style={{ color: C.muted }}>
                          {t.orders.length} order · {t.since ? formatTime(t.since) : '–'}
                        </p>
                      </div>

                      {/* Active statuses */}
                      <div className="flex flex-wrap gap-1">
                        {t.orders.map(o => (
                          <span key={o.id}
                            className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase"
                            style={{
                              background: o.status === 'ready'   ? '#22C55E20'
                                        : o.status === 'cooking' ? '#F59E0B20'
                                        : '#6366F120',
                              color:      o.status === 'ready'   ? '#22C55E'
                                        : o.status === 'cooking' ? '#F59E0B'
                                        : '#818CF8',
                            }}>
                            {o.status}
                          </span>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="pt-1 border-t" style={{ borderColor: C.border }}>
                        <p className="text-xs font-black" style={{ color: cfg.color }}>
                          {formatPrice(t.total)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Live indicator */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs" style={{ color: C.muted }}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Update otomatis · realtime
        </div>
      </div>
    </div>
  )
}
