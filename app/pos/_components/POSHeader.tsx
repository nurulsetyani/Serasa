'use client'
import { Clock, RefreshCw, TrendingUp } from 'lucide-react'
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

export default function POSHeader() {
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
  const branchName = process.env.NEXT_PUBLIC_BRANCH_NAME || 'Al Khobar · ZATCA 2026 ACTIVE'

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-[#1A1208] text-white flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: P }}>
          <span className="text-sm font-black">S</span>
        </div>
        <div>
          <p className="font-black text-sm leading-none">{restoName}</p>
          <p className="text-[9px] text-gray-400 mt-0.5">{branchName}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {summary && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <TrendingUp size={12} className="text-green-400" />
            <div className="text-right">
              <p className="text-[10px] text-gray-400 leading-none">{summary.count} orders today</p>
              <p className="text-xs font-black text-green-400 leading-none mt-0.5">
                {formatPrice(summary.revenue)}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-gray-300">
          <Clock size={13} />
          <span className="text-sm font-mono font-bold">{time}</span>
        </div>

        <button
          onClick={newOrder}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw size={12} />
          New Order
        </button>
      </div>
    </div>
  )
}
