'use client'
import { Minus, Plus, Trash2, ChevronDown, StickyNote } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { POSLine } from '@/types/pos'
import { usePOSStore } from '@/stores/pos.store'
import { formatPrice } from '@/lib/utils'

const P = '#FF6B35'

interface Props {
  line: POSLine
  index: number
}

export default function CartLine({ line, index }: Props) {
  const updateQty = usePOSStore(s => s.updateQty)
  const removeLine = usePOSStore(s => s.removeLine)
  const setLineNote = usePOSStore(s => s.setLineNote)
  const activeLineId = usePOSStore(s => s.activeLineId)
  const setActiveLine = usePOSStore(s => s.setActiveLine)
  const [editingNote, setEditingNote] = useState(false)

  const isActive = activeLineId === line.lineId

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.18 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: isActive ? '#FFF5F1' : '#FAFAF8',
        border: isActive ? `1.5px solid ${P}40` : '1.5px solid transparent',
      }}
    >
      <div
        className="flex items-start gap-2 p-2.5 cursor-pointer"
        onClick={() => setActiveLine(isActive ? null : line.lineId)}
      >
        {/* Index */}
        <span className="text-[10px] font-black text-gray-400 mt-1 w-4 flex-shrink-0">
          {index + 1}
        </span>

        {/* Name & Modifiers */}
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-bold text-[13px] leading-tight">{line.name}</p>
          {line.modifiers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {line.modifiers.map(m => (
                <span
                  key={m.id}
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: `${P}15`, color: P }}
                >
                  {m.name} {m.priceAdj > 0 ? `+${formatPrice(m.priceAdj)}` : ''}
                </span>
              ))}
            </div>
          )}
          {line.note && (
            <p className="text-[10px] text-gray-500 mt-0.5 italic line-clamp-1">{line.note}</p>
          )}
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0">
          <p className="font-black text-[13px]" style={{ color: P }}>{formatPrice(line.lineTotal)}</p>
          {line.qty > 1 && (
            <p className="text-[9px] text-gray-400">{formatPrice(line.unitPrice)} × {line.qty}</p>
          )}
        </div>
      </div>

      {/* Expanded controls */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-2.5 pb-2.5 flex items-center gap-2">
              {/* Qty stepper */}
              <div className="flex items-center gap-1.5 bg-white rounded-xl px-2 py-1 border border-gray-200">
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => updateQty(line.lineId, -1)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ color: line.qty === 1 ? '#EF4444' : '#555' }}
                >
                  {line.qty === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                </motion.button>
                <span className="font-black text-gray-900 text-sm w-5 text-center">{line.qty}</span>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => updateQty(line.lineId, 1)}
                  className="w-6 h-6 rounded-xl text-white flex items-center justify-center"
                  style={{ background: P }}
                >
                  <Plus size={12} />
                </motion.button>
              </div>

              {/* Note button */}
              <button
                onClick={() => setEditingNote(n => !n)}
                className="flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold text-gray-500 bg-white border border-gray-200 hover:border-orange-300"
              >
                <StickyNote size={11} />
                Catatan
              </button>

              {/* Delete */}
              <button
                onClick={() => removeLine(line.lineId)}
                className="ml-auto w-7 h-7 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-50"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Note textarea */}
            <AnimatePresence>
              {editingNote && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden px-2.5 pb-2.5"
                >
                  <textarea
                    value={line.note}
                    onChange={e => setLineNote(line.lineId, e.target.value)}
                    placeholder="Contoh: tidak pedas, extra sambal..."
                    rows={2}
                    className="w-full rounded-xl px-3 py-2 text-xs text-gray-700 resize-none outline-none bg-white border border-gray-200 focus:border-orange-400"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
