'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Plus, Minus, Clock, Star } from 'lucide-react'
import { MenuItem } from '@/types'
import { useLang } from '@/context/LanguageContext'
import { useCart } from '@/context/CartContext'
import { getItemName, getItemDescription } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'

interface Props {
  item: MenuItem
  onAddWithUpsell?: (item: MenuItem) => void
}

export default function MenuCard({ item, onAddWithUpsell }: Props) {
  const { lang, t } = useLang()
  const { items, addItem, updateQty } = useCart()
  const [imgError, setImgError] = useState(false)

  const cartItem = items.find(i => i.id === item.id)
  const qty = cartItem?.qty ?? 0
  const name = getItemName(item, lang)
  const desc = getItemDescription(item, lang)

  function handleAdd() {
    if (qty === 0 && onAddWithUpsell) {
      onAddWithUpsell(item)
    } else {
      addItem(item)
    }
  }

  return (
    <div className="card-dark overflow-hidden flex flex-col group cursor-pointer animate-fade-up">
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-obsidian-surface">
        {!imgError ? (
          <Image
            src={item.image || `https://placehold.co/400x300/1a1a1a/D4AF37?text=${encodeURIComponent(name)}`}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gold-dark text-4xl">🍽️</div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-light/80 via-transparent to-transparent" />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.is_best_seller && (
            <span className="flex items-center gap-1 bg-gold text-obsidian text-[10px] font-bold px-2 py-0.5 rounded-full shadow-gold-sm">
              <Star size={9} fill="currentColor" />
              {t('bestSeller')}
            </span>
          )}
        </div>
        {/* Cook time */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-ink-muted text-[10px] px-2 py-0.5 rounded-full">
          <Clock size={9} />
          <span>{item.cook_time} {t('minutes')}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <div className="flex-1">
          <h3 className="font-display text-ink font-semibold text-sm leading-snug line-clamp-2">
            {name}
          </h3>
          {desc && (
            <p className="text-ink-muted text-[11px] mt-1 line-clamp-2 leading-relaxed">{desc}</p>
          )}
        </div>

        {/* Price + Add button */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
          <div>
            <span className="text-gold font-bold text-sm">{formatPrice(item.price)}</span>
          </div>

          {qty === 0 ? (
            <button
              onClick={handleAdd}
              className="btn-gold flex items-center gap-1 px-3 py-1.5 text-xs"
            >
              <Plus size={12} />
              {t('addToCart')}
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-obsidian rounded-full border border-gold-border px-1 py-0.5">
              <button
                onClick={() => updateQty(item.id, qty - 1)}
                className="w-6 h-6 flex items-center justify-center text-gold hover:bg-gold-muted rounded-full transition-colors"
              >
                <Minus size={12} />
              </button>
              <span className="text-ink font-bold text-sm w-4 text-center">{qty}</span>
              <button
                onClick={() => addItem(item)}
                className="w-6 h-6 flex items-center justify-center text-gold hover:bg-gold-muted rounded-full transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
