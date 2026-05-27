'use client'
import { Clock, RefreshCw, TrendingUp, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { usePOSStore } from '@/stores/pos.store'
import { supabase } from '@/lib/supabase'
import { IS_MOCK_MODE } from '@/lib/mock-data'
import { formatPrice } from '@/lib/utils'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

interface DailySummary {
  count: number
  revenue: number
}

interface Props {
  soundEnabled?: boolean
  onToggleSound?: () => void
}

export default function POSHeader({ soundEnabled = true, onToggleSound }: Props) {
  const [time, setTime] = useState('')
  const [summary, setSummary] = useState<DailySummary | null>(null)
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
      return
    }

    async function fetchData() {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const { data } = await supabase
        .from('orders')
        .select('total_price')
        .eq('restaurant_id', RESTAURANT_ID)
        .neq('status', 'cancelled')
        .gte('created_at', todayStart.toISOString())
      if (data) {
        setSummary({
          count: data.length,
          revenue: data.reduce((s, o) => s + (o.total_price ?? 0), 0),
        })
      }
    }

    fetchData()
    const ch = supabase.channel('pos-header-summary')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, fetchData)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const restoName = process.env.NEXT_PUBLIC_RESTO_NAME || 'Serasa POS'
  const branchName = process.env.NEXT_PUBLIC_BRANCH_NAME || 'Kuday, Mekkah - Saudi Arabia'

  return (
    <div
      className="flex items-center justify-between px-5 py-3 text-white flex-shrink-0"
      style={{ background: 'var(--pos-dark)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center gap-3">
        <Image src="/logof22.png" alt="Logo" width={44} height={44} className="flex-shrink-0 rounded-lg" style={{ objectFit: 'contain' }} />
        <div>
          <p className="font-inter font-bold text-[15px] leading-tight tracking-tight text-white">{restoName}</p>
          <p className="text-[10px] text-white/40 mt-0.5 font-medium tracking-wide">{branchName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {summary && (
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08]">
            <TrendingUp size={13} className="text-emerald-400" />
            <div className="text-right">
              <p className="text-[10px] text-white/40 leading-none font-medium">{summary.count} orders today</p>
              <p className="text-[13px] font-bold text-emerald-400 leading-none mt-1 tracking-tight">
                {formatPrice(summary.revenue)}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06]">
          <Clock size={12} className="text-white/40" />
          <span className="text-[13px] font-mono font-semibold text-white/80 tracking-wider">{time}</span>
        </div>

        {onToggleSound && (
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Matikan notif suara' : 'Aktifkan notif suara'}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-[background-color,color] duration-150"
            style={{
              background: soundEnabled ? 'rgba(255,107,53,0.18)' : 'rgba(255,255,255,0.06)',
              color: soundEnabled ? '#FF6B35' : 'rgba(255,255,255,0.30)',
              border: `1px solid ${soundEnabled ? 'rgba(255,107,53,0.28)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        )}

        <button
          onClick={newOrder}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white hover:bg-white/[0.08] transition-[background-color,color] duration-150"
        >
          <RefreshCw size={12} />
          New Order
        </button>
      </div>
    </div>
  )
}
