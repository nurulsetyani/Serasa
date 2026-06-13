'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Clock, CheckCircle, UtensilsCrossed } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePOSStore } from '@/stores/pos.store'
import { formatPrice } from '@/lib/utils'
import { Order } from '@/types'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!
const TOTAL_TABLES  = 9

type TableStatus = 'kosong' | 'terisi' | 'tagihan'

interface TableInfo {
  number: number
  status: TableStatus
  customerName?: string
  total?: number
  orderCount: number
}

const STATUS_CFG = {
  kosong:  { label: 'Kosong',           color: '#22C55E', bg: '#F0FDF4', border: '#86EFAC' },
  terisi:  { label: 'Terisi',           color: '#F59E0B', bg: '#FFFBEB', border: '#FCD34D' },
  tagihan: { label: 'Tagihan Menunggu', color: '#EF4444', bg: '#FEF2F2', border: '#FCA5A5' },
}

function deriveTableStatus(orders: Order[]): TableStatus {
  if (!orders.length) return 'kosong'
  const hasActive = orders.some(o => ['new', 'pending', 'cooking'].includes(o.status))
  return hasActive ? 'terisi' : 'tagihan'
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function TablePicker({ open, onClose }: Props) {
  const setTable    = usePOSStore(s => s.setTable)
  const tableNumber = usePOSStore(s => s.tableNumber)
  const [orders, setOrders] = useState<Order[]>([])

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, table_number, customer_name, status, total_price, order_type')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('order_type', 'dine_in')
      .in('status', ['new', 'pending', 'cooking', 'ready'])
    setOrders((data as Order[]) ?? [])
  }, [])

  useEffect(() => {
    if (!open) return
    fetchOrders()
    const ch = supabase.channel('table-picker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [open, fetchOrders])

  // Build table info for all 8 tables
  const tables: TableInfo[] = Array.from({ length: TOTAL_TABLES }, (_, i) => {
    const n   = i + 1
    const ord = orders.filter(o => o.table_number === String(n))
    return {
      number:       n,
      status:       deriveTableStatus(ord),
      customerName: ord[0]?.customer_name,
      total:        ord.reduce((s, o) => s + o.total_price, 0) || undefined,
      orderCount:   ord.length,
    }
  })

  const kosongCount  = tables.filter(t => t.status === 'kosong').length
  const terisiCount  = tables.filter(t => t.status === 'terisi').length
  const tagihanCount = tables.filter(t => t.status === 'tagihan').length

  function handleSelect(t: TableInfo) {
    setTable(String(t.number))
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden"
            style={{ background: '#1A1208', boxShadow: '0 -8px 48px rgba(0,0,0,0.5)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <UtensilsCrossed size={18} style={{ color: '#FF6B35' }} />
                <div>
                  <p className="font-black text-white text-sm">Pilih Meja</p>
                  <p className="text-[10px] text-gray-400">
                    {kosongCount} kosong · {terisiCount} terisi · {tagihanCount} tagihan
                  </p>
                </div>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <X size={15} className="text-gray-300" />
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-5 py-2.5 border-b border-white/10">
              {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
                  <span className="text-[10px] text-gray-400">{cfg.label}</span>
                </div>
              ))}
            </div>

            {/* Table grid */}
            <div className="p-4 grid grid-cols-4 gap-3">
              {tables.map(t => {
                const cfg     = STATUS_CFG[t.status]
                const active  = tableNumber === String(t.number)
                return (
                  <motion.button
                    key={t.number}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => handleSelect(t)}
                    className="relative rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all"
                    style={{
                      background:   active ? cfg.color : `${cfg.color}18`,
                      border:       `2px solid ${active ? cfg.color : `${cfg.color}40`}`,
                      boxShadow:    active ? `0 4px 16px ${cfg.color}50` : 'none',
                    }}
                  >
                    {/* Status dot */}
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full"
                      style={{ background: cfg.color, opacity: active ? 0 : 1 }} />

                    {/* Table number */}
                    <span className="font-black text-2xl leading-none"
                      style={{ color: active ? 'white' : cfg.color }}>
                      {t.number}
                    </span>

                    {/* Status info */}
                    {t.status === 'kosong' ? (
                      <span className="text-[9px] font-bold uppercase tracking-wide"
                        style={{ color: active ? 'rgba(255,255,255,0.8)' : '#6EE7B7' }}>
                        Kosong
                      </span>
                    ) : (
                      <div className="w-full text-center">
                        <p className="text-[9px] font-bold truncate w-full"
                          style={{ color: active ? 'rgba(255,255,255,0.9)' : cfg.color }}>
                          {t.customerName ?? '–'}
                        </p>
                        {t.total && (
                          <p className="text-[8px] font-semibold"
                            style={{ color: active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)' }}>
                            {formatPrice(t.total)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Status icon */}
                    {t.status === 'terisi'  && <Clock size={10} style={{ color: active ? 'rgba(255,255,255,0.7)' : cfg.color }} />}
                    {t.status === 'tagihan' && <CheckCircle size={10} style={{ color: active ? 'rgba(255,255,255,0.7)' : cfg.color }} />}
                  </motion.button>
                )
              })}
            </div>

            {/* Currently selected */}
            {tableNumber && (
              <div className="px-5 pb-4">
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.25)' }}>
                  <div className="flex items-center gap-2">
                    <Users size={13} style={{ color: '#FF6B35' }} />
                    <span className="text-xs font-bold text-white">
                      Meja <span style={{ color: '#FF6B35' }}>#{tableNumber}</span> dipilih
                    </span>
                  </div>
                  <button onClick={onClose}
                    className="text-xs font-black px-3 py-1.5 rounded-lg"
                    style={{ background: '#FF6B35', color: 'white' }}>
                    Konfirmasi
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
