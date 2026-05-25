'use client'
import { UtensilsCrossed, ShoppingBag, Bike } from 'lucide-react'
import { usePOSStore } from '@/stores/pos.store'
import { OrderTypeV2 } from '@/types/pos'

const P = '#FF6B35'

const TYPES: { value: OrderTypeV2; icon: React.ElementType; label: string; labelAr: string }[] = [
  { value: 'dine_in',   icon: UtensilsCrossed, label: 'Dine-In',   labelAr: 'تناول داخل' },
  { value: 'take_away', icon: ShoppingBag,     label: 'Takeaway',  labelAr: 'للمنزل' },
  { value: 'delivery',  icon: Bike,            label: 'Delivery',  labelAr: 'توصيل' },
]

export default function OrderTypeBar() {
  const orderType = usePOSStore(s => s.orderType)
  const setOrderType = usePOSStore(s => s.setOrderType)

  return (
    <div className="flex gap-2 px-4 py-2.5 bg-white border-b border-gray-100 flex-shrink-0">
      {TYPES.map(({ value, icon: Icon, label, labelAr }) => {
        const active = orderType === value
        return (
          <button
            key={value}
            onClick={() => setOrderType(value)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all"
            style={{
              background: active ? P : '#F5F2EE',
              color: active ? 'white' : '#9A8A7A',
              boxShadow: active ? `0 3px 10px rgba(255,107,53,0.35)` : 'none',
            }}
          >
            <Icon size={12} />
            <span>{label}</span>
            <span className="opacity-70 font-normal text-[10px]">{labelAr}</span>
          </button>
        )
      })}
    </div>
  )
}
