'use client'
import { Clock, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePOSStore } from '@/stores/pos.store'

const P = '#FF6B35'

export default function POSHeader() {
  const [time, setTime] = useState('')
  const newOrder = usePOSStore(s => s.newOrder)
  const getTotalQty = usePOSStore(s => s.getTotalQty)

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('en-SA', { hour: '2-digit', minute: '2-digit', hour12: false }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
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

      <div className="flex items-center gap-4">
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
