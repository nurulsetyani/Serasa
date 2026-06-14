'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Banknote, Landmark, Shield, ChevronRight, CheckCircle } from 'lucide-react'
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
  { value: 'cash',     label: 'Cash / Tunai',  sublabel: 'Uang kertas / koin',   icon: Banknote, color: '#22C55E' },
  { value: 'transfer', label: 'Bank Transfer', sublabel: 'Transfer ke rekening', icon: Landmark, color: '#3B82F6' },
]

const QUICK_AMOUNTS = [50, 100, 200, 500]

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

export default function PaymentModal({ open, onClose, onConfirm, loading }: Props) {
  const getTotal      = usePOSStore(s => s.getTotal)
  const getChange     = usePOSStore(s => s.getChange)
  const addPayment    = usePOSStore(s => s.addPayment)
  const clearPayments = usePOSStore(s => s.clearPayments)
  const isFullyPaid   = usePOSStore(s => s.isFullyPaid)

  const [selected, setSelected]         = useState<POSPaymentMethod>('cash')
  const [cashInput, setCashInput]       = useState('')
  const [bankConfirmed, setBankConfirmed] = useState(false)

  const total       = getTotal()
  const change      = getChange()
  const activeMethod = METHODS.find(m => m.value === selected)!
  const isCash      = selected === 'cash'
  const cashReceived = parseFloat(cashInput) || 0
  const changeReturn = isCash ? Math.max(0, cashReceived - total) : change
  const canConfirm  = isCash ? isFullyPaid() : bankConfirmed

  function handleSelectMethod(m: POSPaymentMethod) {
    setSelected(m)
    clearPayments()
    setCashInput('')
    setBankConfirmed(false)
    if (m !== 'cash') {
      addPayment({ method: m, amount: total })
    }
  }

  function handleCashInput(val: string) {
    setCashInput(val)
    clearPayments()
    const amt = parseFloat(val)
    if (!isNaN(amt) && amt > 0) addPayment({ method: 'cash', amount: amt })
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
            <div className="flex items-center justify-between px-5 py-3.5" style={{ background: '#1A1208' }}>
              <div className="flex items-center gap-2.5">
                <Shield size={16} className="text-green-400" />
                <div>
                  <p className="text-white font-black text-sm leading-none">Metode Pembayaran</p>
                  <p className="text-[9px] tracking-widest text-gray-400 mt-0.5 uppercase">Select Payment Method</p>
                </div>
              </div>
              <button onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <X size={14} className="text-white" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Method selector */}
              <div className="grid grid-cols-2 gap-2.5">
                {METHODS.map(({ value, label, sublabel, icon: Icon, color }) => {
                  const active = selected === value
                  return (
                    <button key={value} onClick={() => handleSelectMethod(value)}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all"
                      style={{
                        background: active ? `${color}12` : '#F9FAFB',
                        border: `2px solid ${active ? color : '#E5E7EB'}`,
                      }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: active ? `${color}20` : '#F3F4F6' }}>
                        <Icon size={18} style={{ color: active ? color : '#9CA3AF' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black leading-tight truncate"
                          style={{ color: active ? color : '#111827' }}>{label}</p>
                        <p className="text-[9px] text-gray-400 leading-tight mt-0.5 truncate">{sublabel}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Bill amount */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50">
                <span className="text-sm text-gray-500 font-semibold">Total Tagihan:</span>
                <span className="font-black text-lg text-gray-900">{formatPrice(total)}</span>
              </div>

              {/* ── CASH FLOW ── */}
              {isCash && (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                      Uang Diterima (SAR):
                    </label>
                    <input
                      type="number" value={cashInput}
                      onChange={e => handleCashInput(e.target.value)}
                      placeholder={total.toFixed(2)}
                      className="w-full px-4 py-3 rounded-xl text-xl font-black text-gray-900 bg-gray-50 outline-none"
                      style={{ border: `2px solid ${cashInput ? '#22C55E' : '#E5E7EB'}` }}
                    />
                  </div>

                  {/* Quick amounts */}
                  <div className="grid grid-cols-4 gap-2">
                    <button onClick={handleExact}
                      className="py-2 rounded-xl text-xs font-black text-white transition-opacity active:opacity-80"
                      style={{ background: '#22C55E' }}>
                      {total.toFixed(0)} SAR
                    </button>
                    {QUICK_AMOUNTS.map(amt => (
                      <button key={amt} onClick={() => handleQuick(amt)}
                        className="py-2 rounded-xl text-xs font-black transition-colors"
                        style={{
                          background: cashReceived === amt ? '#1A1208' : '#F3F4F6',
                          color: cashReceived === amt ? 'white' : '#374151',
                        }}>
                        {amt}
                      </button>
                    ))}
                  </div>

                  {/* Change */}
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                    style={{ background: changeReturn > 0 ? '#F0FDF4' : '#F9FAFB' }}>
                    <span className="text-sm font-semibold" style={{ color: changeReturn > 0 ? '#15803D' : '#9CA3AF' }}>
                      Uang Kembali:
                    </span>
                    <span className="font-black text-lg" style={{ color: changeReturn > 0 ? '#16A34A' : '#9CA3AF' }}>
                      {formatPrice(changeReturn)}
                    </span>
                  </div>
                </div>
              )}

              {/* ── BANK TRANSFER FLOW ── */}
              {!isCash && (
                <div className="space-y-3">
                  {!bankConfirmed ? (
                    <>
                      {/* Instruction card */}
                      <div className="rounded-2xl overflow-hidden"
                        style={{ border: `2px solid ${activeMethod.color}` }}>
                        <div className="px-4 py-2.5 flex items-center gap-2"
                          style={{ background: activeMethod.color }}>
                          <activeMethod.icon size={14} className="text-white" />
                          <span className="text-white font-black text-xs uppercase tracking-wide">
                            Konfirmasi {activeMethod.label}
                          </span>
                        </div>
                        <div className="px-4 py-4 text-center"
                          style={{ background: `${activeMethod.color}08` }}>
                          <p className="text-3xl font-black mb-1" style={{ color: activeMethod.color }}>
                            {formatPrice(total)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Minta pelanggan transfer ke rekening resto, lalu konfirmasi setelah dana masuk
                          </p>
                        </div>
                      </div>

                      {/* Confirm transfer button */}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setBankConfirmed(true)}
                        className="w-full py-3.5 rounded-xl font-black text-white text-sm flex items-center justify-center gap-2"
                        style={{ background: activeMethod.color }}>
                        <CheckCircle size={16} />
                        Pembayaran Sudah Diterima ✓
                      </motion.button>
                    </>
                  ) : (
                    /* Confirmed state */
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-3 px-4 py-4 rounded-2xl"
                      style={{ background: '#F0FDF4', border: '2px solid #22C55E' }}>
                      <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-black text-green-800 text-sm">Pembayaran Diterima ✓</p>
                        <p className="text-xs text-green-600">
                          {formatPrice(total)} via {activeMethod.label}
                        </p>
                      </div>
                      <button onClick={() => setBankConfirmed(false)}
                        className="ml-auto text-xs text-green-600 underline font-semibold">
                        Batal
                      </button>
                    </motion.div>
                  )}
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
                style={{ background: '#EF4444', boxShadow: canConfirm ? '0 6px 20px rgba(239,68,68,0.35)' : 'none' }}>
                {loading
                  ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <>Check &amp; Sign E-Invoice (ZATCA) <ChevronRight size={16} /></>
                }
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
