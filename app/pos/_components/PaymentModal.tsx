'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Banknote, CreditCard, Smartphone, Wallet, Building2, Check } from 'lucide-react'
import { usePOSStore } from '@/stores/pos.store'
import { POSPayment, POSPaymentMethod } from '@/types/pos'
import { formatPrice } from '@/lib/utils'

const P = '#FF6B35'

const METHODS: { value: POSPaymentMethod; label: string; labelAr: string; icon: React.ElementType; color: string }[] = [
  { value: 'cash',     label: 'Tunai',     labelAr: 'نقدي',      icon: Banknote,  color: '#22C55E' },
  { value: 'mada',     label: 'Mada',      labelAr: 'مدى',       icon: CreditCard,color: '#3B82F6' },
  { value: 'visa',     label: 'Visa/MC',   labelAr: 'فيزا',      icon: CreditCard,color: '#6366F1' },
  { value: 'qris',     label: 'QRIS',      labelAr: 'QRIS',      icon: Smartphone,color: '#EC4899' },
  { value: 'transfer', label: 'Transfer',  labelAr: 'تحويل',     icon: Building2, color: '#F59E0B' },
]

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

export default function PaymentModal({ open, onClose, onConfirm, loading }: Props) {
  const payments = usePOSStore(s => s.payments)
  const addPayment = usePOSStore(s => s.addPayment)
  const removePayment = usePOSStore(s => s.removePayment)
  const getTotal = usePOSStore(s => s.getTotal)
  const getAmountPaid = usePOSStore(s => s.getAmountPaid)
  const getChange = usePOSStore(s => s.getChange)
  const isFullyPaid = usePOSStore(s => s.isFullyPaid)

  const [selectedMethod, setSelectedMethod] = useState<POSPaymentMethod>('cash')
  const [inputAmount, setInputAmount] = useState('')

  const total = getTotal()
  const amountPaid = getAmountPaid()
  const remaining = Math.max(0, total - amountPaid)
  const change = getChange()

  function addCurrentPayment() {
    const amt = Number(inputAmount) || remaining
    if (amt <= 0) return
    addPayment({ method: selectedMethod, amount: Math.min(amt, remaining + change) })
    setInputAmount('')
  }

  function handleExactCash() {
    addPayment({ method: 'cash', amount: remaining })
    setInputAmount('')
  }

  function handleRound() {
    const rounded = Math.ceil(remaining / 1000) * 1000
    addPayment({ method: 'cash', amount: rounded })
    setInputAmount('')
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden z-10"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-black text-gray-900 text-base">Proses Pembayaran</h3>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Total display */}
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#FFF5F1]">
                <span className="font-bold text-gray-700 text-sm">Total Tagihan</span>
                <span className="font-black text-xl" style={{ color: P }}>{formatPrice(total)}</span>
              </div>

              {/* Payment method tabs */}
              <div className="grid grid-cols-5 gap-1.5">
                {METHODS.map(({ value, label, icon: Icon, color }) => {
                  const active = selectedMethod === value
                  return (
                    <button
                      key={value}
                      onClick={() => setSelectedMethod(value)}
                      className="flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
                      style={{
                        background: active ? `${color}15` : '#F5F2EE',
                        border: `2px solid ${active ? color : 'transparent'}`,
                      }}
                    >
                      <Icon size={16} style={{ color: active ? color : '#9CA3AF' }} />
                      <span className="text-[9px] font-black" style={{ color: active ? color : '#9CA3AF' }}>
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="number"
                    value={inputAmount}
                    onChange={e => setInputAmount(e.target.value)}
                    placeholder={`${remaining} (sisa tagihan)`}
                    className="w-full px-4 py-3.5 rounded-xl text-lg font-black text-gray-900 bg-[#F5F2EE] outline-none"
                    style={{ border: `2px solid ${inputAmount ? P : 'transparent'}` }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">SR</span>
                </div>

                {/* Quick cash buttons */}
                {selectedMethod === 'cash' && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleExactCash}
                      className="flex-1 py-2 rounded-xl text-xs font-black text-white"
                      style={{ background: '#22C55E' }}
                    >
                      Pas {formatPrice(remaining)}
                    </button>
                    <button
                      onClick={handleRound}
                      className="flex-1 py-2 rounded-xl text-xs font-black bg-[#F5F2EE] text-gray-700"
                    >
                      Bulatkan
                    </button>
                    <button
                      onClick={addCurrentPayment}
                      className="flex-1 py-2 rounded-xl text-xs font-black text-white"
                      style={{ background: P }}
                    >
                      + Tambah
                    </button>
                  </div>
                )}
                {selectedMethod !== 'cash' && (
                  <button
                    onClick={addCurrentPayment}
                    className="w-full py-2.5 rounded-xl text-sm font-black text-white"
                    style={{ background: P }}
                  >
                    + Tambah Pembayaran
                  </button>
                )}
              </div>

              {/* Payment list */}
              {payments.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black tracking-[2px] uppercase text-gray-400">Pembayaran</p>
                  {payments.map((p, i) => {
                    const m = METHODS.find(m => m.value === p.method)
                    return (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F5F2EE]">
                        <div className="flex items-center gap-2">
                          {m && <m.icon size={14} style={{ color: m.color }} />}
                          <span className="text-sm font-semibold text-gray-700">{m?.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm" style={{ color: P }}>{formatPrice(p.amount)}</span>
                          <button onClick={() => removePayment(i)} className="text-red-400 hover:text-red-600">
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Summary */}
              {payments.length > 0 && (
                <div className="border-t border-gray-100 pt-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Dibayar</span>
                    <span className="font-bold">{formatPrice(amountPaid)}</span>
                  </div>
                  {remaining > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-500 font-semibold">Sisa</span>
                      <span className="font-black text-red-500">{formatPrice(remaining)}</span>
                    </div>
                  )}
                  {change > 0 && (
                    <div className="flex justify-between">
                      <span className="font-black text-green-700">Kembalian</span>
                      <span className="font-black text-xl text-green-700">{formatPrice(change)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confirm button */}
            <div className="px-5 pb-5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onConfirm}
                disabled={!isFullyPaid() || loading}
                className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: isFullyPaid() ? '#22C55E' : P }}
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><Check size={18} /> Konfirmasi Order</>
                }
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
