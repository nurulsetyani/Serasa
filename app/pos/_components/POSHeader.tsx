'use client'
import { Clock, RefreshCw, TrendingUp, QrCode } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePOSStore } from '@/stores/pos.store'
import { supabase } from '@/lib/supabase'
import { IS_MOCK_MODE } from '@/lib/mock-data'
import { formatPrice } from '@/lib/utils'

const P = '#FF6B35'
const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

interface DailySummary {
  count: number
  revenue: number
}

interface PlatformCounts {
  qr: number
  hungerstation: number
  keeta: number
}

interface Props {
  onOpenIncoming: () => void
  onOpenHungerStation: () => void
  onOpenKeeta: () => void
}

export default function POSHeader({ onOpenIncoming, onOpenHungerStation, onOpenKeeta }: Props) {
  const [time, setTime] = useState('')
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [counts, setCounts] = useState<PlatformCounts>({ qr: 0, hungerstation: 0, keeta: 0 })
  const newOrder = usePOSStore(s => s.newOrder)

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('en-SA', { hour: '2-digit', minute: '2-digit', hour12: false }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (IS_MOCK_MODE) {
      setSummary({ count: 12, revenue: 1840 })
      setCounts({ qr: 2, hungerstation: 1, keeta: 0 })
      return
    }

    async function fetchData() {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const [salesRes, qrRes, hsRes, ktRes] = await Promise.all([
        supabase
          .from('orders')
          .select('total_price')
          .eq('restaurant_id', RESTAURANT_ID)
          .neq('status', 'cancelled')
          .gte('created_at', todayStart.toISOString()),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', RESTAURANT_ID)
          .eq('source', 'qr')
          .eq('status', 'pending'),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', RESTAURANT_ID)
          .eq('source', 'hungerstation')
          .eq('status', 'pending'),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', RESTAURANT_ID)
          .eq('source', 'keeta')
          .eq('status', 'pending'),
      ])

      if (salesRes.data) {
        setSummary({
          count: salesRes.data.length,
          revenue: salesRes.data.reduce((s, o) => s + (o.total_price ?? 0), 0),
        })
      }
      setCounts({
        qr: qrRes.count ?? 0,
        hungerstation: hsRes.count ?? 0,
        keeta: ktRes.count ?? 0,
      })
    }

    fetchData()

    const ch = supabase.channel('pos-header')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, fetchData)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, fetchData)
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#1A1208] text-white flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: P }}>
          <span className="text-sm font-black">S</span>
        </div>
        <div>
          <p className="font-black text-sm leading-none">Serasa POS</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Cashier Mode</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Daily summary */}
        {summary && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <TrendingUp size={12} className="text-green-400" />
            <div className="text-right">
              <p className="text-[10px] text-gray-400 leading-none">{summary.count} order hari ini</p>
              <p className="text-xs font-black text-green-400 leading-none mt-0.5">
                {formatPrice(summary.revenue)}
              </p>
            </div>
          </div>
        )}

        {/* QR orders button */}
        <PlatformButton
          label="QR Order"
          count={counts.qr}
          color="#FF6B35"
          onClick={onOpenIncoming}
          icon={<QrCode size={13} />}
        />

        {/* HungerStation button */}
        <PlatformButton
          label="HungerStation"
          count={counts.hungerstation}
          color="#FF6000"
          onClick={onOpenHungerStation}
          icon={<span className="text-[10px] font-black leading-none">HS</span>}
        />

        {/* Keeta button */}
        <PlatformButton
          label="Keeta"
          count={counts.keeta}
          color="#00C851"
          onClick={onOpenKeeta}
          icon={<span className="text-[10px] font-black leading-none">KT</span>}
        />

        <div className="flex items-center gap-1.5 text-gray-300">
          <Clock size={13} />
          <span className="text-sm font-mono font-bold">{time}</span>
        </div>

        <button
          onClick={newOrder}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw size={12} />
          Order Baru
        </button>
      </div>
    </div>
  )
}

function PlatformButton({
  label, count, color, onClick, icon,
}: {
  label: string
  count: number
  color: string
  onClick: () => void
  icon: React.ReactNode
}) {
  const active = count > 0
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
      style={{
        background: active ? `${color}25` : 'rgba(255,255,255,0.08)',
        color: active ? '#FFB347' : 'rgba(255,255,255,0.6)',
        border: `1px solid ${active ? `${color}50` : 'transparent'}`,
      }}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <span
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center animate-pulse"
          style={{ background: '#EF4444' }}
        >
          {count}
        </span>
      )}
    </button>
  )
}
