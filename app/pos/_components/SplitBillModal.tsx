'use client'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, DollarSign, Plus, Minus, Printer, Check } from 'lucide-react'
import { usePOSStore } from '@/stores/pos.store'
import { formatPrice } from '@/lib/utils'

const P = '#FF6B35'

interface SplitPerson {
  id: string
  label: string
  amount: number
  paid: boolean
}

interface Props {
  open: boolean
  onClose: () => void
}

type SplitMode = 'equal' | 'custom'

export default function SplitBillModal({ open, onClose }: Props) {
  const getTotal = usePOSStore(s => s.getTotal)
  const lines = usePOSStore(s => s.lines)
  const lang = usePOSStore(s => s.lang)

  const total = getTotal()

  const [mode, setMode] = useState<SplitMode>('equal')
  const [numPeople, setNumPeople] = useState(2)
  const [persons, setPersons] = useState<SplitPerson[]>([])
  const [customSetup, setCustomSetup] = useState(false)
  const [printedIdx, setPrintedIdx] = useState<number[]>([])

  const perPerson = Math.ceil(total / numPeople)
  const lastPersonAmt = total - perPerson * (numPeople - 1)

  // Generate persons when mode/count changes
  function generateEqualSplit() {
    const ps: SplitPerson[] = Array.from({ length: numPeople }, (_, i) => ({
      id: crypto.randomUUID(),
      label: `Orang ${i + 1}`,
      amount: i === numPeople - 1 ? lastPersonAmt : perPerson,
      paid: false,
    }))
    setPersons(ps)
    setCustomSetup(true)
  }

  function generateCustomSplit() {
    const ps: SplitPerson[] = Array.from({ length: numPeople }, (_, i) => ({
      id: crypto.randomUUID(),
      label: `Orang ${i + 1}`,
      amount: 0,
      paid: false,
    }))
    setPersons(ps)
    setCustomSetup(true)
  }

  const customTotal = persons.reduce((s, p) => s + p.amount, 0)
  const remaining = total - customTotal

  function updateAmount(idx: number, val: number) {
    setPersons(prev => prev.map((p, i) => i === idx ? { ...p, amount: Math.max(0, val) } : p))
  }

  function updateLabel(idx: number, label: string) {
    setPersons(prev => prev.map((p, i) => i === idx ? { ...p, label } : p))
  }

  function togglePaid(idx: number) {
    setPersons(prev => prev.map((p, i) => i === idx ? { ...p, paid: !p.paid } : p))
  }

  function handlePrint(idx: number) {
    setPrintedIdx(prev => [...prev, idx])
    const person = persons[idx]
    printSplitReceipt(person, idx + 1)
  }

  function printSplitReceipt(person: SplitPerson, num: number) {
    const itemLines = lines.map(l =>
      `<tr>
        <td>${l.name}</td>
        <td style="text-align:right">${l.qty}×</td>
        <td style="text-align:right">${formatPrice(l.lineTotal)}</td>
      </tr>`
    ).join('')

    const html = `
      <html><head><title>Split Bill #${num}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Courier New', monospace; font-size: 11px; width: 80mm; padding: 4mm; }
        h2 { text-align:center; font-size:14px; margin-bottom:4px; }
        .center { text-align:center; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        table { width:100%; border-collapse:collapse; }
        td { padding: 2px 0; vertical-align:top; }
        .total-row td { font-weight:bold; font-size:13px; padding-top:6px; }
        .badge { border: 1px solid #000; display:inline-block; padding: 2px 8px; font-size: 10px; }
      </style></head>
      <body>
        <h2>SERASA RESTAURANT</h2>
        <p class="center" style="font-size:10px">Split Bill — ${person.label}</p>
        <p class="center" style="font-size:10px">${new Date().toLocaleString('id-ID')}</p>
        <div class="divider"></div>
        <table>
          <thead><tr><td><b>Item</b></td><td></td><td style="text-align:right"><b>Harga</b></td></tr></thead>
          <tbody>${itemLines}</tbody>
        </table>
        <div class="divider"></div>
        <table>
          <tr class="total-row">
            <td colspan="2">TAGIHAN ${person.label}</td>
            <td style="text-align:right">${formatPrice(person.amount)}</td>
          </tr>
        </table>
        <div class="divider"></div>
        <p class="center" style="font-size:9px; margin-top:6px">Terima kasih telah berkunjung!</p>
        <p class="center" style="font-size:9px">شكراً لزيارتكم</p>
      </body></html>
    `
    const win = window.open('', '_blank', 'width=380,height=600')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  const allPaid = persons.length > 0 && persons.every(p => p.paid)

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
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden z-10 flex flex-col"
            style={{ maxHeight: '90dvh', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Users size={18} style={{ color: P }} />
                <h3 className="font-black text-gray-900 text-base">Split Bill</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-black text-lg" style={{ color: P }}>{formatPrice(total)}</span>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                  <X size={15} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!customSetup ? (
                <div className="p-5 space-y-5">
                  {/* Mode toggle */}
                  <div className="flex gap-2 p-1 bg-[#F5F2EE] rounded-2xl">
                    {(['equal', 'custom'] as SplitMode[]).map(m => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
                        style={{
                          background: mode === m ? 'white' : 'transparent',
                          color: mode === m ? '#1A1208' : '#9A8A7A',
                          boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                        }}
                      >
                        {m === 'equal' ? '⚖ Rata' : '✏ Custom'}
                      </button>
                    ))}
                  </div>

                  {/* Jumlah orang */}
                  <div>
                    <p className="text-xs font-black tracking-[2px] uppercase text-gray-400 mb-3">Jumlah Orang</p>
                    <div className="flex items-center justify-center gap-6">
                      <motion.button whileTap={{ scale: 0.85 }}
                        onClick={() => setNumPeople(n => Math.max(2, n - 1))}
                        className="w-12 h-12 rounded-2xl border-2 border-gray-200 flex items-center justify-center"
                      >
                        <Minus size={18} className="text-gray-600" />
                      </motion.button>
                      <span className="font-black text-5xl text-gray-900 w-12 text-center">{numPeople}</span>
                      <motion.button whileTap={{ scale: 0.85 }}
                        onClick={() => setNumPeople(n => Math.min(10, n + 1))}
                        className="w-12 h-12 rounded-2xl text-white flex items-center justify-center"
                        style={{ background: P }}
                      >
                        <Plus size={18} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Preview rata */}
                  {mode === 'equal' && (
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: numPeople }, (_, i) => (
                        <div key={i} className="flex justify-between px-3 py-2.5 rounded-xl bg-[#F5F2EE]">
                          <span className="text-sm font-semibold text-gray-600">Orang {i + 1}</span>
                          <span className="font-black text-sm" style={{ color: P }}>
                            {formatPrice(i === numPeople - 1 ? lastPersonAmt : perPerson)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => mode === 'equal' ? generateEqualSplit() : generateCustomSplit()}
                    className="w-full py-4 rounded-2xl font-black text-white text-sm"
                    style={{ background: P, boxShadow: `0 6px 20px rgba(255,107,53,0.35)` }}
                  >
                    Lanjut →
                  </button>
                </div>
              ) : (
                /* Split detail per orang */
                <div className="p-5 space-y-3">
                  {mode === 'custom' && remaining !== 0 && (
                    <div
                      className="flex justify-between items-center px-3 py-2.5 rounded-xl text-sm font-bold"
                      style={{
                        background: remaining > 0 ? '#FFF5F1' : '#F0FDF4',
                        color: remaining > 0 ? '#EF4444' : '#16A34A',
                      }}
                    >
                      <span>{remaining > 0 ? 'Belum dibagi' : 'Kelebihan'}</span>
                      <span>{formatPrice(Math.abs(remaining))}</span>
                    </div>
                  )}

                  {persons.map((person, idx) => (
                    <div
                      key={person.id}
                      className="rounded-2xl overflow-hidden"
                      style={{
                        border: `2px solid ${person.paid ? '#22C55E' : '#F0EAE0'}`,
                        background: person.paid ? '#F0FDF4' : 'white',
                      }}
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        {/* Label input */}
                        <input
                          value={person.label}
                          onChange={e => updateLabel(idx, e.target.value)}
                          className="flex-1 font-black text-gray-900 text-sm bg-transparent outline-none"
                        />

                        {/* Amount */}
                        {mode === 'custom' ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400 font-semibold">SR</span>
                            <input
                              type="number"
                              value={person.amount || ''}
                              onChange={e => updateAmount(idx, Number(e.target.value))}
                              placeholder="0"
                              className="w-20 text-right font-black text-sm text-gray-900 bg-[#F5F2EE] rounded-lg px-2 py-1 outline-none"
                            />
                          </div>
                        ) : (
                          <span className="font-black text-sm" style={{ color: P }}>{formatPrice(person.amount)}</span>
                        )}

                        {/* Print */}
                        <button
                          onClick={() => handlePrint(idx)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: printedIdx.includes(idx) ? '#F0FDF4' : '#F5F2EE' }}
                          title="Print struk"
                        >
                          {printedIdx.includes(idx)
                            ? <Check size={13} className="text-green-600" />
                            : <Printer size={13} className="text-gray-500" />
                          }
                        </button>

                        {/* Paid toggle */}
                        <button
                          onClick={() => togglePaid(idx)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: person.paid ? '#22C55E' : '#F5F2EE' }}
                          title="Mark as paid"
                        >
                          <Check size={13} className={person.paid ? 'text-white' : 'text-gray-400'} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="flex justify-between items-center pt-2 px-1">
                    <span className="text-sm text-gray-500">
                      {persons.filter(p => p.paid).length}/{persons.length} sudah bayar
                    </span>
                    <span className="font-black text-sm" style={{ color: allPaid ? '#22C55E' : P }}>
                      {allPaid ? '✓ Lunas' : `Sisa ${persons.filter(p => !p.paid).length} orang`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {customSetup && (
              <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
                <button
                  onClick={() => { setCustomSetup(false); setPersons([]); setPrintedIdx([]) }}
                  className="px-4 py-3 rounded-2xl font-bold text-gray-600 bg-[#F5F2EE] text-sm"
                >
                  ← Ubah
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl font-black text-white text-sm"
                  style={{ background: allPaid ? '#22C55E' : P }}
                >
                  {allPaid ? '✓ Selesai' : 'Tutup'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
