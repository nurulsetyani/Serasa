'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Tag, Hash } from 'lucide-react'
import { usePOSStore } from '@/stores/pos.store'
import { DiscountType } from '@/types/pos'
import { formatPrice } from '@/lib/utils'

const P = '#FF6B35'

interface Props {
  open: boolean
  onClose: () => void
}

export default function DiscountModal({ open, onClose }: Props) {
  const setDiscount = usePOSStore(s => s.setDiscount)
  const clearDiscount = usePOSStore(s => s.clearDiscount)
  const discountType = usePOSStore(s => s.discountType)
  const discountValue = usePOSStore(s => s.discountValue)
  const getSubtotal = usePOSStore(s => s.getSubtotal)

  const [type, setType] = useState<DiscountType>(discountType ?? 'percent')
  const [value, setValue] = useState(discountValue > 0 ? String(discountValue) : '')

  const numVal = Number(value) || 0
  const subtotal = getSubtotal()
  const preview = type === 'percent'
    ? Math.round(subtotal * numVal / 100)
    : Math.min(numVal, subtotal)

  function apply() {
    if (numVal <= 0) { clearDiscount(); onClose(); return }
    if (type === 'percent' && numVal > 100) return
    setDiscount(type, numVal)
    onClose()
  }

  const QUICK_PERCENT = [5, 10, 15, 20, 25, 50]

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="relative w-full max-w-sm bg-white rounded-t-3xl p-5 z-10"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900 text-base">Tambah Diskon</h3>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Type toggle */}
            <div className="flex gap-2 mb-4">
              {([['percent', '%', Tag], ['fixed', 'SR', Hash]] as const).map(([t, label, Icon]) => (
                <button
                  key={t}
                  onClick={() => { setType(t as DiscountType); setValue('') }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm transition-all"
                  style={{
                    background: type === t ? P : '#F5F2EE',
                    color: type === t ? 'white' : '#9A8A7A',
                  }}
                >
                  <Icon size={14} />
                  {label === '%' ? 'Persen (%)' : 'Nominal (SR)'}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="relative mb-3">
              <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={type === 'percent' ? '0 – 100' : '0'}
                min={0}
                max={type === 'percent' ? 100 : undefined}
                className="w-full px-4 py-4 rounded-2xl text-2xl font-black text-center text-gray-900 outline-none bg-[#F5F2EE] focus:bg-white"
                style={{ border: `2px solid ${value ? P : 'transparent'}`, transition: 'all 0.15s' }}
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                {type === 'percent' ? '%' : 'SR'}
              </span>
            </div>

            {/* Quick % buttons */}
            {type === 'percent' && (
              <div className="grid grid-cols-6 gap-1.5 mb-4">
                {QUICK_PERCENT.map(p => (
                  <button
                    key={p}
                    onClick={() => setValue(String(p))}
                    className="py-2 rounded-xl text-xs font-black transition-all"
                    style={{
                      background: Number(value) === p ? P : '#F5F2EE',
                      color: Number(value) === p ? 'white' : '#6B7280',
                    }}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            )}

            {/* Preview */}
            {numVal > 0 && (
              <div className="flex justify-between items-center mb-4 px-4 py-3 rounded-2xl bg-green-50">
                <span className="text-sm text-green-700 font-semibold">Hemat</span>
                <span className="font-black text-green-700">{formatPrice(preview)}</span>
              </div>
            )}

            <div className="flex gap-2">
              {discountType && (
                <button
                  onClick={() => { clearDiscount(); onClose() }}
                  className="px-4 py-3.5 rounded-2xl font-bold text-red-500 bg-red-50 text-sm"
                >
                  Hapus
                </button>
              )}
              <button
                onClick={apply}
                className="flex-1 py-3.5 rounded-2xl font-black text-white text-sm"
                style={{ background: P }}
              >
                Terapkan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
