'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Banknote, CreditCard, Smartphone, Shield, ChevronRight } from 'lucide-react'
import { usePOSStore } from '@/stores/pos.store'
import { POSPaymentMethod } from '@/types/pos'
import { formatPrice } from '@/lib/utils'

interface Method {
  value: POSPaymentMethod
  label: string
  sublabel: string
  icon: React.ElementType
  color: string
}

const METHODS: Method[] = [
  { value: 'cash',     label: 'Cash / Tunai',       sublabel: 'Simulasi terima uang kertas', icon: Banknote,    color: '#22C55E' },
  { value: 'mada',     label: 'Mada Debit Card',    sublabel: 'Saudi payment scheme',        icon: CreditCard,  color: '#3B82F6' },
  { value: 'visa',     label: 'Visa & Mastercard',  sublabel: 'Safar, SAB, Al-Rajhi',        icon: CreditCard,  color: '#6366F1' },
  { value: 'applepay', label: 'Apple Pay / NFC',    sublabel: 'Simulator tap terminal',       icon: Smartphone,  color: '#1A1208' },
]

const QUICK_AMOUNTS = [100, 200, 500]

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

export default function PaymentModal({ open, onClose, onConfirm, loading }: Props) {
  const getTotal    = usePOSStore(s => s.getTotal)
  const getChange   = usePOSStore(s => s.getChange)
  const addPayment  = usePOSStore(s => s.addPayment)
  const clearPayments = usePOSStore(s => s.clearPayments)
  const isFullyPaid = usePOSStore(s => s.isFullyPaid)

  const [selected, setSelected] = useState<POSPaymentMethod>('cash')
  const [cashInput, setCashInput] = useState('')

  const total    = getTotal()
  const change   = getChange()
  const isCash   = selected === 'cash'

  // Sync cash payment on input change
  function handleCashInput(val: string) {
    setCashInput(val)
    clearPayments()
    const amt = parseFloat(val)
    if (!isNaN(amt) && amt > 0) {
      addPayment({ method: 'cash', amount: amt })
    }
  }

  function handleQuick(amt: number) {
    clearPayments()
    addPayment({ method: 'cash', amount: amt })
    setCashInput(String(amt))
  }

  function handleExact() {
    clearPayments()
    addPayment({ method: 'cash', amount: total })
    setCashInput(total.toFixed(2))
  }

  function handleSelectMethod(m: POSPaymentMethod) {
    setSelected(m)
    clearPayments()
    setCashInput('')
    if (m !== 'cash') {
      // Non-cash: auto-pay full amount
      addPayment({ method: m, amount: total })
    }
  }

  const cashReceived = parseFloat(cashInput) || 0
  const changeReturn = isCash ? Math.max(0, cashReceived - total) : change
  const canConfirm   = isFullyPaid()

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
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ background: '#1A1208' }}
            >
              <div className="flex items-center gap-2.5">
                <Shield size={16} className="text-green-400" />
                <div>
                  <p className="text-white font-black text-sm leading-none">
                    Pilih Metode Pembayaran <span className="font-normal opacity-70">(Select Payment)</span>
                  </p>
                  <p className="text-[9px] tracking-widest text-gray-400 mt-0.5 uppercase">
                    Fatoora Saudi Compliant Gateway
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={14} className="text-white" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* 2×2 payment method grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {METHODS.map(({ value, label, sublabel, icon: Icon, color }) => {
                  const active = selected === value
                  return (
                    <button
                      key={value}
                      onClick={() => handleSelectMethod(value)}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all"
                      style={{
                        background: active ? `${color}12` : '#F9FAFB',
                        border: `2px solid ${active ? color : '#E5E7EB'}`,
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: active ? `${color}20` : '#F3F4F6' }}
                      >
                        <Icon size={18} style={{ color: active ? color : '#9CA3AF' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black leading-tight truncate"
                          style={{ color: active ? color : '#111827' }}>
                          {label}
                        </p>
                        <p className="text-[9px] text-gray-400 leading-tight mt-0.5 truncate">
                          {sublabel}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Bill amount */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50">
                <span className="text-sm text-gray-500 font-semibold">Bill Amount:</span>
                <span className="font-black text-lg text-gray-900">{formatPrice(total)}</span>
              </div>

              {/* Cash input — only for cash method */}
              {isCash && (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                      Cash Received (SAR):
                    </label>
                    <input
                      type="number"
                      value={cashInput}
                      onChange={e => handleCashInput(e.target.value)}
                      placeholder={total.toFixed(2)}
                      className="w-full px-4 py-3 rounded-xl text-xl font-black text-gray-900 bg-gray-50 outline-none"
                      style={{ border: `2px solid ${cashInput ? '#22C55E' : '#E5E7EB'}` }}
                    />
                  </div>

                  {/* Quick amount buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={handleExact}
                      className="py-2 rounded-xl text-xs font-black text-white transition-opacity active:opacity-80"
                      style={{ background: '#22C55E' }}
                    >
                      {total.toFixed(0)} SAR
                    </button>
                    {QUICK_AMOUNTS.map(amt => (
                      <button
                        key={amt}
                        onClick={() => handleQuick(amt)}
                        className="py-2 rounded-xl text-xs font-black transition-colors"
                        style={{
                          background: cashReceived === amt ? '#1A1208' : '#F3F4F6',
                          color: cashReceived === amt ? 'white' : '#374151',
                        }}
                      >
                        {amt} SAR
                      </button>
                    ))}
                  </div>

                  {/* Change return */}
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                    style={{ background: changeReturn > 0 ? '#F0FDF4' : '#F9FAFB' }}>
                    <span className="text-sm font-semibold" style={{ color: changeReturn > 0 ? '#15803D' : '#9CA3AF' }}>
                      Uang Kembali <span className="font-normal text-[11px]">(Change Return):</span>
                    </span>
                    <span className="font-black text-lg" style={{ color: changeReturn > 0 ? '#16A34A' : '#9CA3AF' }}>
                      {formatPrice(changeReturn)}
                    </span>
                  </div>
                </div>
              )}

              {/* Non-cash: show auto-paid confirmation */}
              {!isCash && canConfirm && (
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-50">
                  <span className="text-sm font-semibold text-blue-700">Amount charged:</span>
                  <span className="font-black text-lg text-blue-700">{formatPrice(total)}</span>
                </div>
              )}
            </div>

            {/* Confirm button */}
            <div className="px-5 pb-5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onConfirm}
                disabled={!canConfirm || loading}
                className="w-full py-4 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
                style={{ background: '#EF4444', boxShadow: canConfirm ? '0 6px 20px rgba(239,68,68,0.35)' : 'none' }}
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <>
                    Check &amp; Sign E-Invoice (ZATCA)
                    <ChevronRight size={16} />
                  </>
                }
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
