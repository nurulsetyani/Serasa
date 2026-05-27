'use client'
import Image from 'next/image'
import { Plus, Star, ChevronDown, Flame } from 'lucide-react'
import { useState } from 'react'
import { MenuItem } from '@/types'
import { usePOSStore } from '@/stores/pos.store'
import { formatPrice, discountedPrice } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useModifiers } from '@/hooks/useModifiers'
import ModifierSheet from './ModifierSheet'

const P = '#FF6B35'

interface Props {
  item: MenuItem
}

export default function ProductCard({ item }: Props) {
  const addLine = usePOSStore(s => s.addLine)
  const lines = usePOSStore(s => s.lines)
  const { hasModifiers } = useModifiers(item.id)
  const [sheetOpen, setSheetOpen] = useState(false)

  const finalPrice = discountedPrice(item.price, item.discount_percent)
  const hasDiscount = (item.discount_percent ?? 0) > 0
  const inCart = lines.filter(l => l.menuId === item.id).reduce((s, l) => s + l.qty, 0)
  const unavailable = item.is_available === false

  function handleTap() {
    if (unavailable) return
    if (hasModifiers) {
      setSheetOpen(true)
    } else {
      addLine(item)
    }
  }

  const shadowClass = inCart > 0
    ? 'shadow-[0_4px_16px_rgba(255,107,53,0.18)] hover:shadow-[0_8px_28px_rgba(255,107,53,0.28)]'
    : 'shadow-[0_2px_8px_rgba(26,18,8,0.07),0_1px_2px_rgba(26,18,8,0.04)] hover:shadow-[0_8px_24px_rgba(26,18,8,0.10),0_2px_6px_rgba(26,18,8,0.05)]'

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleTap}
        disabled={unavailable}
        className={`group relative flex flex-col bg-white rounded-2xl overflow-hidden text-left hover:-translate-y-0.5 transition-[box-shadow,transform,border-color] duration-200 ease-out ${shadowClass}`}
        style={{
          border: inCart > 0 ? `2px solid ${P}` : '2px solid transparent',
          opacity: unavailable ? 0.45 : 1,
        }}
      >
        {/* kcal + Stock row */}
        <div className="flex items-center justify-between px-2 pt-1.5 pb-0">
          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
            <Flame size={9} className="text-orange-300" />
            {item.calories ?? '—'} kCal
          </span>
          <span className="text-[10px] text-gray-400">
            Stock: {(item as MenuItem & { stock?: number }).stock ?? '∞'}
          </span>
        </div>

        {/* Image */}
        <div className="relative w-full aspect-[4/3] bg-amber-50 mt-1">
          <Image
            src={item.image || '/hero-food.png'}
            alt={item.name_en}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 200px"
          />

          {/* Overlay badges */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
            {hasDiscount && (
              <span
                className="text-white text-[9px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: 'linear-gradient(135deg,#EF4444,#FF6B35)' }}
              >
                -{item.discount_percent}%
              </span>
            )}
            {item.is_best_seller && (
              <span
                className="flex items-center gap-0.5 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: P }}
              >
                <Star size={7} fill="white" />
              </span>
            )}
          </div>

          {/* Cart badge */}
          {inCart > 0 && (
            <div
              className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-black"
              style={{ background: P, boxShadow: `0 2px 6px rgba(255,107,53,0.5)` }}
            >
              {inCart}
            </div>
          )}

          {/* Modifier indicator */}
          {hasModifiers && (
            <div
              className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black text-white"
              style={{ background: 'rgba(0,0,0,0.55)' }}
            >
              <ChevronDown size={8} />
              Options
            </div>
          )}

          {/* Unavailable overlay */}
          {unavailable && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-[10px] font-black text-gray-500 bg-white px-2 py-1 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-2.5 pb-3 pt-2 flex-1 flex flex-col">
          {/* English name */}
          <p className="text-gray-900 font-semibold text-[12px] leading-snug line-clamp-2 mb-0.5 font-inter">
            {item.name_en}
          </p>
          {/* Arabic name */}
          {item.name_ar && (
            <p className="text-gray-400 text-[10px] leading-tight line-clamp-1 mb-2">
              {item.name_ar}
            </p>
          )}

          <div className="flex items-end justify-between gap-1 mt-auto">
            <div>
              <p className="font-bold text-[13px] font-inter tracking-tight" style={{ color: P }}>{formatPrice(finalPrice)}</p>
              {hasDiscount && (
                <p className="text-[9px] text-gray-400 line-through">{formatPrice(item.price)}</p>
              )}
            </div>
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-[background-color] duration-150 group-hover:bg-[#FF6B35] group-hover:[&>*]:text-white"
              style={{ background: `${P}18` }}
            >
              {hasModifiers
                ? <ChevronDown size={13} style={{ color: P }} />
                : <Plus size={13} style={{ color: P }} />
              }
            </div>
          </div>
        </div>
      </motion.button>

      <ModifierSheet
        item={sheetOpen ? item : null}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
  )
}
