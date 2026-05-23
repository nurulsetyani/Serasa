'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Plus, AlertCircle } from 'lucide-react'
import { MenuItem } from '@/types'
import { ModifierGroup, ModifierOption, POSModifier } from '@/types/pos'
import { usePOSStore } from '@/stores/pos.store'
import { formatPrice } from '@/lib/utils'
import { useModifiers } from '@/hooks/useModifiers'

const P = '#FF6B35'

interface Props {
  item: MenuItem | null
  open: boolean
  onClose: () => void
  editLineId?: string   // kalau edit existing line
}

type Selections = Record<string, string[]>  // groupId → modifierId[]

export default function ModifierSheet({ item, open, onClose, editLineId }: Props) {
  const { groups, loading } = useModifiers(item?.id ?? '')
  const addLine = usePOSStore(s => s.addLine)
  const addModifier = usePOSStore(s => s.addModifier)
  const lang = usePOSStore(s => s.lang)

  const [selections, setSelections] = useState<Selections>({})
  const [qty, setQty] = useState(1)

  if (!item) return null

  const name = lang === 'ar' ? (item.name_ar || item.name_id) : lang === 'en' ? item.name_en : item.name_id
  const basePrice = item.discount_percent
    ? Math.round(item.price * (1 - item.discount_percent / 100))
    : item.price

  // Hitung total modifier price
  const modTotal = Object.values(selections).flat().reduce((sum, modId) => {
    for (const g of groups) {
      const m = g.modifiers.find(m => m.id === modId)
      if (m) return sum + m.price_adjustment
    }
    return sum
  }, 0)
  const lineTotal = (basePrice + modTotal) * qty

  function toggleSingle(group: ModifierGroup, modId: string) {
    setSelections(prev => ({
      ...prev,
      [group.id]: prev[group.id]?.[0] === modId ? [] : [modId],
    }))
  }

  function toggleMultiple(group: ModifierGroup, modId: string) {
    setSelections(prev => {
      const current = prev[group.id] ?? []
      if (current.includes(modId)) {
        return { ...prev, [group.id]: current.filter(id => id !== modId) }
      }
      if (current.length >= group.max_select) return prev
      return { ...prev, [group.id]: [...current, modId] }
    })
  }

  function getModName(m: ModifierOption) {
    if (lang === 'ar' && m.name_ar) return m.name_ar
    if (lang === 'en') return m.name_en
    return m.name_id
  }

  function getGroupName(g: ModifierGroup) {
    if (lang === 'ar' && g.name_ar) return g.name_ar
    if (lang === 'en') return g.name_en
    return g.name_id
  }

  // Validasi required groups
  const missingRequired = groups
    .filter(g => g.required)
    .filter(g => !(selections[g.id] ?? []).length)

  function handleAdd() {
    if (!item || missingRequired.length > 0) return

    // Kumpulkan semua modifier yang dipilih
    const selectedMods: POSModifier[] = Object.entries(selections).flatMap(([groupId, ids]) =>
      ids.map(modId => {
        const group = groups.find(g => g.id === groupId)!
        const mod = group.modifiers.find(m => m.id === modId)!
        return { id: mod.id, groupId, name: getModName(mod), priceAdj: mod.price_adjustment }
      })
    )

    if (editLineId) {
      selectedMods.forEach(m => addModifier(editLineId, m))
    } else {
      // Tambah line baru — addLine dulu lalu inject modifier via store getState
      const itemRef = item  // capture agar tidak null di dalam timeout
      addLine(itemRef)
      setTimeout(() => {
        const { lines } = usePOSStore.getState()
        const newest = lines.filter(l => l.menuId === itemRef.id).at(-1)
        if (newest && selectedMods.length > 0) {
          selectedMods.forEach(m => usePOSStore.getState().addModifier(newest.lineId, m))
        }
      }, 0)
    }

    // Reset & tutup
    setSelections({})
    setQty(1)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="relative w-full bg-white rounded-t-3xl z-10 flex flex-col"
            style={{ maxHeight: '90dvh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 py-3 flex-shrink-0">
              <div>
                <h3 className="font-black text-gray-900 text-base">{name}</h3>
                <p className="text-sm font-bold mt-0.5" style={{ color: P }}>
                  {formatPrice(basePrice)}
                  {modTotal !== 0 && (
                    <span className="text-gray-500 font-normal">
                      {' '}+ {formatPrice(Math.abs(modTotal))} modifier
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
              >
                <X size={15} className="text-gray-500" />
              </button>
            </div>

            {/* Scrollable groups */}
            <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-5">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-orange-400 rounded-full animate-spin" />
                </div>
              )}

              {!loading && groups.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6">Tidak ada pilihan modifier</p>
              )}

              {groups.map(group => {
                const sel = selections[group.id] ?? []
                const isFull = sel.length >= group.max_select && group.type === 'multiple'
                const isMissingRequired = group.required && sel.length === 0

                return (
                  <div key={group.id}>
                    {/* Group header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-gray-900 text-sm">{getGroupName(group)}</p>
                        {group.required && (
                          <span
                            className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                            style={{ background: isMissingRequired ? '#EF4444' : '#22C55E' }}
                          >
                            WAJIB
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {group.type === 'single' ? 'Pilih 1' : `Pilih maks. ${group.max_select}`}
                      </span>
                    </div>

                    {/* Options */}
                    <div className="space-y-1.5">
                      {group.modifiers.filter(m => m.is_available).map(mod => {
                        const selected = sel.includes(mod.id)
                        const disabled = !selected && isFull

                        return (
                          <motion.button
                            key={mod.id}
                            whileTap={{ scale: 0.98 }}
                            disabled={disabled}
                            onClick={() =>
                              group.type === 'single'
                                ? toggleSingle(group, mod.id)
                                : toggleMultiple(group, mod.id)
                            }
                            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all"
                            style={{
                              background: selected ? `${P}12` : disabled ? '#F9F9F9' : '#F5F2EE',
                              border: `2px solid ${selected ? P : 'transparent'}`,
                              opacity: disabled ? 0.45 : 1,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {/* Checkbox / Radio indicator */}
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                                style={{
                                  background: selected ? P : '#E5E1DC',
                                  borderRadius: group.type === 'single' ? '50%' : '6px',
                                }}
                              >
                                {selected && <Check size={11} className="text-white" strokeWidth={3} />}
                              </div>
                              <span className="font-semibold text-gray-900 text-sm">{getModName(mod)}</span>
                            </div>

                            {mod.price_adjustment !== 0 && (
                              <span
                                className="text-xs font-black"
                                style={{ color: mod.price_adjustment > 0 ? P : '#22C55E' }}
                              >
                                {mod.price_adjustment > 0 ? '+' : ''}{formatPrice(mod.price_adjustment)}
                              </span>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer: qty + add button */}
            <div className="flex-shrink-0 px-5 pt-3 pb-6 border-t border-gray-100 space-y-3">
              {/* Missing required warning */}
              {missingRequired.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50">
                  <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600 font-semibold">
                    Wajib pilih: {missingRequired.map(g => getGroupName(g)).join(', ')}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Qty stepper */}
                <div className="flex items-center gap-2 bg-[#F5F2EE] rounded-2xl px-2 py-1.5">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600"
                  >
                    −
                  </button>
                  <span className="font-black text-gray-900 text-lg w-6 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(q => q + 1)}
                    className="w-8 h-8 rounded-xl text-white flex items-center justify-center"
                    style={{ background: P }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Add button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAdd}
                  disabled={missingRequired.length > 0}
                  className="flex-1 py-3.5 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: P, boxShadow: `0 6px 20px rgba(255,107,53,0.35)` }}
                >
                  <Plus size={16} />
                  Tambah · {formatPrice(lineTotal)}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
