'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Clock, Star, Minus, Plus, ShoppingBag, Flame } from 'lucide-react'
import { MenuItem } from '@/types'
import { supabase } from '@/lib/supabase'
import { MOCK_MENU, IS_MOCK_MODE } from '@/lib/mock-data'
import { useLang } from '@/context/LanguageContext'
import { useCart } from '@/context/CartContext'
import { getItemName, getItemDescription } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'

export default function MenuDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { lang, t, isRTL } = useLang()
  const { items: cartItems, addItem, updateQty } = useCart()

  const [item, setItem] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [tableNumber, setTableNumber] = useState('1')
  const [imgError, setImgError] = useState(false)
  const [added, setAdded] = useState(false)
  const [itemNotes, setItemNotes] = useState('')

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
        setItem(MOCK_MENU.find(m => m.id === id) ?? null)
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
    addItem(item, itemNotes.trim() || undefined)
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
        <button onClick={() => router.back()} className="bg-[#D4AF37] text-[#0D0D0D] px-6 py-3 rounded-xl font-bold">
          Kembali
        </button>
      </div>
    )
  }

  const name = getItemName(item, lang)
  const desc = getItemDescription(item, lang)
  const notesPlaceholder: Record<string, string> = {
    id: 'cth: tanpa bawang, tidak pedas...',
    en: 'e.g. no onions, less spicy...',
    ar: 'مثال: بدون بصل، قليل الحرارة...',
  }

  return (
    <div className="min-h-dvh bg-[#0D0D0D]" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Hero image */}
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/10 to-transparent" />

        {/* Back button */}
        <div className="absolute top-4 left-4 safe-top">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
          >
            <ArrowLeft size={18} className={isRTL ? 'rotate-180' : ''} />
          </button>
        </div>

        {item.is_best_seller && (
          <div className="absolute top-4 right-4">
            <span className="bg-[#D4AF37] text-[#0D0D0D] text-[10px] font-black px-3 py-1 rounded-full">
              🔥 {t('bestSeller')}
            </span>
          </div>
        )}
      </div>

      {/* Content panel */}
      <div className="relative -mt-6 bg-[#0D0D0D] rounded-t-[28px] px-5 pt-6 pb-36">
        <div className="w-10 h-1 bg-[#2A2A2A] rounded-full mx-auto mb-5" />

        {/* Name + price */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1 className="font-display text-white text-2xl font-bold leading-tight flex-1">{name}</h1>
          <span className="text-[#D4AF37] font-black text-2xl flex-shrink-0">{formatPrice(item.price)}</span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={13} className={i < 4 ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-[#2A2A2A]'} />
            ))}
            <span className="text-[#555] text-xs ml-1">4.8</span>
          </div>
          <div className="flex items-center gap-1 text-[#555] text-xs">
            <Clock size={12} />
            <span>{item.cook_time} {t('minutes')}</span>
          </div>
          {item.calories && (
            <div className="flex items-center gap-1 text-[#555] text-xs">
              <Flame size={12} />
              <span>{item.calories} kcal</span>
            </div>
          )}
        </div>

        {/* Description */}
        {desc && (
          <p className="text-[#888] text-sm leading-relaxed mb-5 pb-5 border-b border-white/5">{desc}</p>
        )}

        {/* Notes / Catatan */}
        <div className="mb-5">
          <p className="text-white font-semibold text-sm mb-2">
            {lang === 'ar' ? 'ملاحظات' : lang === 'id' ? 'Catatan (opsional)' : 'Notes (optional)'}
          </p>
          <textarea
            value={itemNotes}
            onChange={e => setItemNotes(e.target.value)}
            placeholder={notesPlaceholder[lang] ?? notesPlaceholder.en}
            rows={3}
            className="w-full bg-[#1A1A1A] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#444] outline-none focus:border-[#D4AF37]/30 resize-none transition-colors"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>

        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          {['Halal ✓', 'No MSG', 'Fresh Daily'].map(b => (
            <span key={b} className="bg-[#1A1A1A] border border-white/6 text-[#555] text-[10px] px-3 py-1 rounded-full">
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D]/98 backdrop-blur-xl border-t border-white/5 px-5 py-4 safe-bottom">
        {qty === 0 ? (
          <button
            onClick={handleAdd}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
              added
                ? 'bg-green-500 text-white scale-[0.98]'
                : 'bg-[#D4AF37] text-[#0D0D0D] shadow-[0_4px_24px_rgba(212,175,55,0.35)] active:scale-[0.97]'
            }`}
          >
            {added ? <>✓ Ditambahkan!</> : <><ShoppingBag size={18} /> {t('addToCart')} — {formatPrice(item.price)}</>}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-[#1A1A1A] rounded-2xl px-4 py-3 border border-[#D4AF37]/20">
              <button
                onClick={() => updateQty(item.id, qty - 1)}
                className="w-7 h-7 rounded-full bg-[#D4AF37]/12 text-[#D4AF37] flex items-center justify-center"
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
              className="flex-1 py-3.5 rounded-2xl bg-[#D4AF37] text-[#0D0D0D] font-bold flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              {t('cart')} · {formatPrice(item.price * qty)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
