'use client'
import { useEffect, useState } from 'react'
import { Cloud, QrCode, Truck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { IS_MOCK_MODE } from '@/lib/mock-data'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

interface Props {
  onOpenQR: () => void
  onOpenDelivery: (source: string) => void
}

interface Counts {
  qr: number
  hs: number
  keeta: number
}

export default function CloudIntegrationsBanner({ onOpenQR, onOpenDelivery }: Props) {
  const [counts, setCounts] = useState<Counts>({ qr: 0, hs: 0, keeta: 0 })

  useEffect(() => {
    if (IS_MOCK_MODE) {
      setCounts({ qr: 2, hs: 1, keeta: 0 })
      return
    }

    async function fetchCounts() {
      const [qrRes, hsRes, ktRes] = await Promise.all([
        supabase
          .from('orders').select('id', { count: 'exact', head: true })
          .eq('restaurant_id', RESTAURANT_ID).eq('source', 'qr').eq('status', 'new'),
        supabase
          .from('orders').select('id', { count: 'exact', head: true })
          .eq('restaurant_id', RESTAURANT_ID).eq('source', 'hungerstation').eq('status', 'new'),
        supabase
          .from('orders').select('id', { count: 'exact', head: true })
          .eq('restaurant_id', RESTAURANT_ID).eq('source', 'keeta').eq('status', 'new'),
      ])
      setCounts({
        qr:    qrRes.count ?? 0,
        hs:    hsRes.count ?? 0,
        keeta: ktRes.count ?? 0,
      })
    }

    fetchCounts()
    const ch = supabase.channel('cloud-banner')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, fetchCounts)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, fetchCounts)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  return (
    <div
      className="flex items-center justify-between px-5 py-2.5 flex-shrink-0"
      style={{ background: '#0F1724', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Left: label */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <Cloud size={12} className="text-white/30" />
        <span className="text-[10px] font-semibold tracking-widest text-white/40 uppercase font-inter">
          Cloud API
        </span>
        <span className="text-[10px] text-white/20">
          / قنوات الربط السحابية
        </span>
      </div>

      {/* Right: order count buttons */}
      <div className="flex items-center gap-2">
        <CountButton
          icon={<QrCode size={12} />}
          label="Dine-In/Takeaway QR"
          count={counts.qr}
          color="#FF6B35"
          onClick={onOpenQR}
        />
        {/* Show separate buttons if both have orders, otherwise one combined button */}
        {counts.hs > 0 && counts.keeta > 0 ? (
          <>
            <CountButton
              icon={<span className="font-black text-[10px]">HS</span>}
              label="HungerStation"
              count={counts.hs}
              color="#FF6000"
              onClick={() => onOpenDelivery('hungerstation')}
            />
            <CountButton
              icon={<span className="font-black text-[10px]">KT</span>}
              label="Keeta"
              count={counts.keeta}
              color="#00C851"
              onClick={() => onOpenDelivery('keeta')}
            />
          </>
        ) : (
          <CountButton
            icon={<Truck size={12} />}
            label={counts.keeta > 0 ? 'Keeta' : 'Delivery Apps'}
            count={counts.hs + counts.keeta}
            color={counts.keeta > 0 ? '#00C851' : '#3B82F6'}
            onClick={() => onOpenDelivery(counts.keeta > 0 ? 'keeta' : 'hungerstation')}
          />
        )}
      </div>
    </div>
  )
}

function CountButton({
  icon, label, count, color, onClick,
}: {
  icon: React.ReactNode
  label: string
  count: number
  color: string
  onClick: () => void
}) {
  const active = count > 0
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
      style={{
        background: active ? `${color}20` : 'rgba(255,255,255,0.06)',
        color: active ? color : 'rgba(255,255,255,0.5)',
        border: `1px solid ${active ? `${color}40` : 'transparent'}`,
      }}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <>
          <span
            className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black text-white"
            style={{ background: color }}
          >
            {count}
          </span>
          <span
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping"
            style={{ background: color, opacity: 0.7 }}
          />
        </>
      )}
    </button>
  )
}
