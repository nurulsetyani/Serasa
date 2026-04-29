'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Clock, Star, Minus, Plus, ShoppingBag } from 'lucide-react'
import { MenuItem } from '@/types'
import { supabase } from '@/lib/supabase'
import { MOCK_MENU, IS_MOCK_MODE } from '@/lib/mock-data'
import { useLang } from '@/context/LanguageContext'
import { useCart } from '@/context/CartContext'
import { getItemName, getItemDescription } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'

const SPICY_LEVELS = [
  { key: 'none',   label: 'Tidak Pedas', labelEn: 'Not Spicy', labelAr: 'غير حار',  emoji: '😌' },
  { key: 'mild',   label: 'Sedang',      labelEn: 'Mild',       labelAr: 'خفيف',     emoji: '🌶' },
  { key: 'hot',    label: 'Pedas',       labelEn: 'Hot',        labelAr: 'حار',      emoji: '🌶🌶' },
  { key: 'xhot',   label: 'Extra Pedas', labelEn: 'Extra Hot',  labelAr: 'حار جداً', emoji: '🌶🌶🌶' },
]

export default function MenuDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { lang, t, isRTL } = useLang()
  const { items: cartItems, addItem, updateQty } = useCart()

  const [item, setItem] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [spicy, setSpicy] = useState('none')
  const [tableNumber, setTableNumber] = useState('1')
  const [imgError, setImgError] = useState(false)
  const [added, setAdded] = useState(false)

  const cartItem = item ? cartItems.find(i => i.id === item.id) : null
  const qty = cartItem?.qty ?? 0

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setTableNumber(p.get('table') ?? '1')
  }, [])

  useEffect(() => {
    async function fetchItem() {
      setLoading(true)
      if (IS_MOCK_MODE) {
        const found = MOCK_MENU.find(m => m.id === id)
        setItem(found ?? null)
        setLoading(false)
        return
      }
      const { data } = await supabase.from('menu').select('*').eq('id', id).single()
      setItem(data as MenuItem ?? null)
      setLoading(false)
    }
    fetchItem()
  }, [id])

  function handleAdd() {
    if (!item) return
    addItem(item)
    setAdded(true)
    setTimeout(() => setAdded(false), 1000)
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-[#D4AF37] text-4xl animate-spin">⟳</div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-dvh bg-[#0D0D0D] flex flex-col items-center justify-center p-8 text-center">
        <p className="text-[#666] mb-4">Menu tidak ditemukan</p>
        <button onClick={() => router.back()} className="btn-gold px-6 py-3 rounded-xl">Kembali</button>
      </div>
    )
  }

  const name = getItemName(item, lang)
  const desc = getItemDescription(item, lang)
  const displayPrice = item.promo_price ?? item.price

  return (
    <div className="min-h-dvh bg-[#0D0D0D]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* HERO IMAGE */}
      <div className="relative h-[320px]">
        {!imgError ? (
          <Image
            src={item.image || `https://placehold.co/800x600/1a1a1a/D4AF37?text=${encodeURIComponent(name)}`}
            alt={name}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-[#1A1A1A] flex items-center justify-center text-6xl">🍽️</div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/10 to-transparent" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 safe-top">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
          >
            <ArrowLeft size={18} className={isRTL ? 'rotate-180' : ''} />
          </button>

          {item.is_best_seller && (
            <span className="bg-[#D4AF37] text-[#0D0D0D] text-[10px] font-black px-3 py-1 rounded-full">
              🔥 {t('bestSeller')}
            </span>
          )}
        </div>
      </div>

      {/* CONTENT PANEL */}
      <div className="relative -mt-6 bg-[#0D0D0D] rounded-t-[28px] px-5 pt-6 pb-32">
        {/* Pill handle */}
        <div className="w-10 h-1 bg-[#333] rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="font-display text-white text-2xl font-bold leading-tight flex-1">{name}</h1>
          <div className="text-right flex-shrink-0">
            {item.promo_price ? (
              <>
                <p className="text-[#444] text-xs line-through">{formatPrice(item.price)}</p>
                <p className="text-[#D4AF37] font-black text-2xl">{formatPrice(displayPrice)}</p>
              </>
            ) : (
              <p className="text-[#D4AF37] font-black text-2xl">{formatPrice(item.price)}</p>
            )}
          </div>
        </div>

        {/* Rating + cook time */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={13} className={i < 4 ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-[#333]'} />
            ))}
            <span className="text-[#666] text-xs ml-1">4.8</span>
          </div>
          <div className="flex items-center gap-1 text-[#666] text-xs">
            <Clock size={12} />
            <span>{item.cook_time} {t('minutes')}</span>
          </div>
        </div>

        {/* Description */}
        {desc && (
          <p className="text-[#888] text-sm leading-relaxed mb-5 border-b border-white/5 pb-5">{desc}</p>
        )}

        {/* Spicy level */}
        <div className="mb-5">
          <p className="text-white font-semibold text-sm mb-3">
            {lang === 'ar' ? 'مستوى الحرارة' : lang === 'id' ? 'Tingkat Kepedasan' : 'Spicy Level'}
          </p>
          <div className="flex gap-2 flex-wrap">
            {SPICY_LEVELS.map(s => (
              <button
                key={s.key}
                onClick={() => setSpicy(s.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                  spicy === s.key
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]'
                    : 'bg-[#1A1A1A] border-white/8 text-[#666] hover:border-white/20'
                }`}
              >
                <span>{s.emoji}</span>
                <span>{lang === 'ar' ? s.labelAr : lang === 'id' ? s.label : s.labelEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5 mb-5" />

        {/* Nutrition badges */}
        <div className="flex gap-2 flex-wrap">
          {['Halal ✓', 'No MSG', 'Fresh Daily'].map(badge => (
            <span key={badge} className="bg-[#1A1A1A] border border-white/8 text-[#666] text-[10px] px-3 py-1 rounded-full">
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* STICKY BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-white/5 px-5 py-4 safe-bottom">
        {qty === 0 ? (
          <button
            onClick={handleAdd}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
              added
                ? 'bg-green-500 text-white scale-[0.98]'
                : 'bg-[#D4AF37] text-[#0D0D0D] shadow-[0_8px_32px_rgba(212,175,55,0.35)] active:scale-[0.97]'
            }`}
          >
            {added ? (
              <><span>✓</span> Ditambahkan!</>
            ) : (
              <><ShoppingBag size={18} /> {t('addToCart')} — {formatPrice(displayPrice)}</>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-[#1A1A1A] rounded-2xl px-4 py-3 border border-[#D4AF37]/20">
              <button
                onClick={() => updateQty(item.id, qty - 1)}
                className="w-7 h-7 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center hover:bg-[#D4AF37]/25 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="text-white font-bold text-lg w-6 text-center">{qty}</span>
              <button
                onClick={() => addItem(item)}
                className="w-7 h-7 rounded-full bg-[#D4AF37] text-[#0D0D0D] flex items-center justify-center"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={() => router.push(`/cart?table=${tableNumber}`)}
              className="flex-1 py-3.5 rounded-2xl bg-[#D4AF37] text-[#0D0D0D] font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,175,55,0.3)]"
            >
              <ShoppingBag size={16} />
              {t('cart')} · {formatPrice(displayPrice * qty)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
