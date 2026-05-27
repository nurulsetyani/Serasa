'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Banknote, CreditCard, Smartphone, Shield, ChevronRight, Wifi, CheckCircle, XCircle } from 'lucide-react'
import { usePOSStore } from '@/stores/pos.store'
import { POSPaymentMethod } from '@/types/pos'
import { formatPrice } from '@/lib/utils'

type TapStatus = 'idle' | 'creating' | 'waiting' | 'captured' | 'declined' | 'error'

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

  const [selected, setSelected]   = useState<POSPaymentMethod>('cash')
  const [cashInput, setCashInput] = useState('')
  const [tapStatus, setTapStatus] = useState<TapStatus>('idle')
  const [tapChargeId, setTapChargeId] = useState<string | null>(null)
  const [tapSandbox, setTapSandbox]   = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total   = getTotal()
  const change  = getChange()
  const isCash  = selected === 'cash'
  const isCard  = !isCash

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
    setTapStatus('idle')
    setTapChargeId(null)
    if (pollRef.current) clearInterval(pollRef.current)
    if (m !== 'cash') {
      addPayment({ method: m, amount: total })
    }
  }

  // Start Tap charge when card method selected and modal opens
  async function startTapCharge() {
    setTapStatus('creating')
    try {
      const res = await fetch('/api/payment/tap/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, currency: 'SAR', description: 'Serasa Restaurant' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setTapChargeId(data.id)
      setTapSandbox(data.sandbox ?? false)
      setTapStatus('waiting')
      startPolling(data.id)
    } catch {
      setTapStatus('error')
    }
  }

  function startPolling(chargeId: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/tap/status?chargeId=${chargeId}`)
        const data = await res.json()
        if (data.status === 'CAPTURED') {
          clearInterval(pollRef.current!)
          setTapStatus('captured')
        } else if (['DECLINED', 'CANCELLED', 'FAILED'].includes(data.status)) {
          clearInterval(pollRef.current!)
          setTapStatus('declined')
        }
      } catch {}
    }, 2000)
  }

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  async function simulateApprove() {
    if (!tapChargeId) return
    await fetch('/api/payment/tap/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chargeId: tapChargeId, status: 'CAPTURED' }),
    })
  }

  const cashReceived = parseFloat(cashInput) || 0
  const changeReturn = isCash ? Math.max(0, cashReceived - total) : change
  const cardApproved = tapStatus === 'captured'
  const canConfirm   = isCash ? isFullyPaid() : cardApproved

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

              {/* Card payment — Tap Terminal flow */}
              {isCard && (
                <div className="space-y-3">
                  {/* Step 1: Initiate */}
                  {tapStatus === 'idle' && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={startTapCharge}
                      className="w-full py-3 rounded-xl font-black text-white text-sm flex items-center justify-center gap-2"
                      style={{ background: '#3B82F6' }}
                    >
                      <Wifi size={15} /> Kirim ke Terminal {selected === 'mada' ? 'Mada' : selected === 'visa' ? 'Visa/MC' : 'NFC'}
                    </motion.button>
                  )}

                  {/* Step 2: Creating charge */}
                  {tapStatus === 'creating' && (
                    <div className="flex items-center justify-center gap-3 py-3 rounded-xl bg-blue-50">
                      <span className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-sm font-semibold text-blue-700">Menghubungkan terminal...</span>
                    </div>
                  )}

                  {/* Step 3: Waiting for tap/swipe */}
                  {tapStatus === 'waiting' && (
                    <div className="rounded-xl overflow-hidden" style={{ border: '2px solid #3B82F6' }}>
                      <div className="bg-blue-600 px-4 py-2.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-white font-black text-xs uppercase tracking-wide">
                          Menunggu Pembayaran Terminal
                        </span>
                      </div>
                      <div className="px-4 py-3 bg-blue-50 text-center">
                        <p className="text-2xl font-black text-blue-900 mb-1">{formatPrice(total)}</p>
                        <p className="text-xs text-blue-600">Minta pelanggan tap / swipe kartu Mada di terminal</p>
                        <p className="text-[10px] text-blue-400 mt-1 font-mono">{tapChargeId}</p>
                      </div>

                      {/* Sandbox: simulate approve button */}
                      {tapSandbox && (
                        <div className="px-4 pb-3 bg-blue-50">
                          <button
                            onClick={simulateApprove}
                            className="w-full py-2 rounded-lg text-xs font-black text-white"
                            style={{ background: '#F59E0B' }}
                          >
                            🧪 Sandbox: Simulate Terminal Approve
                          </button>
                          <p className="text-[9px] text-blue-400 text-center mt-1">
                            Tombol ini hanya muncul di sandbox mode
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4: Approved */}
                  {tapStatus === 'captured' && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50"
                      style={{ border: '2px solid #22C55E' }}>
                      <CheckCircle size={22} className="text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-black text-green-800">Pembayaran Approved ✓</p>
                        <p className="text-xs text-green-600">{formatPrice(total)} — Terminal berhasil</p>
                      </div>
                    </div>
                  )}

                  {/* Declined */}
                  {tapStatus === 'declined' && (
                    <div className="rounded-xl overflow-hidden" style={{ border: '2px solid #EF4444' }}>
                      <div className="px-4 py-3 bg-red-50 flex items-center gap-3">
                        <XCircle size={22} className="text-red-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-black text-red-700">Pembayaran Ditolak</p>
                          <p className="text-xs text-red-500">Kartu declined / cancelled oleh terminal</p>
                        </div>
                        <button
                          onClick={() => { setTapStatus('idle'); setTapChargeId(null) }}
                          className="text-xs font-bold text-red-600 underline"
                        >
                          Coba lagi
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {tapStatus === 'error' && (
                    <div className="px-4 py-3 rounded-xl bg-red-50 flex items-center justify-between"
                      style={{ border: '1px solid #FCA5A5' }}>
                      <p className="text-xs text-red-600 font-semibold">Gagal terhubung ke Tap API</p>
                      <button
                        onClick={() => setTapStatus('idle')}
                        className="text-xs font-bold text-red-600 underline"
                      >
                        Retry
                      </button>
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
