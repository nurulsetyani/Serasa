'use client'
import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { MenuItem } from '@/types'
import {
  OrderTypeV2, DiscountType,
  POSModifier, POSLine, POSPayment,
} from '@/types/pos'

// ── Helper ────────────────────────────────────────────────
function calcLineTotal(line: POSLine): number {
  const modSum = line.modifiers.reduce((s, m) => s + m.priceAdj, 0)
  return (line.unitPrice + modSum) * line.qty
}

function getItemName(item: MenuItem, lang: string): string {
  if (lang === 'ar' && item.name_ar) return item.name_ar
  if (lang === 'en') return item.name_en
  return item.name_id
}

// ── State & Actions ───────────────────────────────────────
interface POSState {
  lines: POSLine[]
  orderType: OrderTypeV2
  tableNumber: string
  customerName: string
  customerPhone: string
  deliveryAddress: string
  discountType: DiscountType | null
  discountValue: number
  taxPercent: number
  taxInclusive: boolean
  payments: POSPayment[]
  searchQuery: string
  selectedCategory: string | null
  activeLineId: string | null
  lang: 'id' | 'en' | 'ar'
}

interface POSActions {
  addLine: (item: MenuItem) => void
  removeLine: (lineId: string) => void
  updateQty: (lineId: string, delta: number) => void
  setQty: (lineId: string, qty: number) => void
  setLineNote: (lineId: string, note: string) => void
  addModifier: (lineId: string, mod: POSModifier) => void
  removeModifier: (lineId: string, modId: string) => void
  duplicateLine: (lineId: string) => void

  setOrderType: (t: OrderTypeV2) => void
  setTable: (table: string) => void
  setCustomer: (name: string, phone?: string) => void
  setDeliveryAddress: (addr: string) => void

  setDiscount: (type: DiscountType, value: number) => void
  clearDiscount: () => void

  addPayment: (p: POSPayment) => void
  removePayment: (idx: number) => void
  clearPayments: () => void

  setSearch: (q: string) => void
  setCategory: (id: string | null) => void
  setActiveLine: (id: string | null) => void
  setLang: (lang: 'id' | 'en' | 'ar') => void

  getSubtotal: () => number
  getDiscountAmount: () => number
  getTaxAmount: () => number
  getTotal: () => number
  getAmountPaid: () => number
  getChange: () => number
  isFullyPaid: () => boolean
  getTotalQty: () => number

  clearCart: () => void
  newOrder: () => void
}

export const usePOSStore = create<POSState & POSActions>()(
  devtools(
    persist(
      (set, get) => ({
        // ── Initial State ──
        lines: [],
        orderType: 'dine_in',
        tableNumber: '',
        customerName: 'Guest',
        customerPhone: '',
        deliveryAddress: '',
        discountType: null,
        discountValue: 0,
        taxPercent: 15,      // Saudi VAT 15%
        taxInclusive: false,
        payments: [],
        searchQuery: '',
        selectedCategory: null,
        activeLineId: null,
        lang: 'id',

        // ── Cart ──
        addLine: (item) => set(s => {
          const lang = s.lang
          const name = getItemName(item, lang)
          const unitPrice = item.discount_percent
            ? Math.round(item.price * (1 - item.discount_percent / 100))
            : item.price

          const existing = s.lines.find(l => l.menuId === item.id && l.modifiers.length === 0)
          if (existing) {
            return {
              lines: s.lines.map(l =>
                l.lineId === existing.lineId
                  ? { ...l, qty: l.qty + 1, lineTotal: calcLineTotal({ ...l, qty: l.qty + 1 }) }
                  : l
              ),
            }
          }

          const newLine: POSLine = {
            lineId: crypto.randomUUID(),
            menuId: item.id,
            name,
            unitPrice,
            modifiers: [],
            qty: 1,
            note: '',
            lineTotal: unitPrice,
          }
          return { lines: [...s.lines, newLine] }
        }),

        removeLine: (lineId) => set(s => ({
          lines: s.lines.filter(l => l.lineId !== lineId),
          activeLineId: s.activeLineId === lineId ? null : s.activeLineId,
        })),

        updateQty: (lineId, delta) => set(s => ({
          lines: s.lines
            .map(l => {
              if (l.lineId !== lineId) return l
              const qty = Math.max(0, l.qty + delta)
              return { ...l, qty, lineTotal: calcLineTotal({ ...l, qty }) }
            })
            .filter(l => l.qty > 0),
        })),

        setQty: (lineId, qty) => set(s => {
          if (qty <= 0) return { lines: s.lines.filter(l => l.lineId !== lineId) }
          return {
            lines: s.lines.map(l =>
              l.lineId === lineId ? { ...l, qty, lineTotal: calcLineTotal({ ...l, qty }) } : l
            ),
          }
        }),

        setLineNote: (lineId, note) => set(s => ({
          lines: s.lines.map(l => l.lineId === lineId ? { ...l, note } : l),
        })),

        addModifier: (lineId, mod) => set(s => ({
          lines: s.lines.map(l => {
            if (l.lineId !== lineId) return l
            const mods = [...l.modifiers.filter(m => m.groupId !== mod.groupId || !mod.groupId), mod]
            return { ...l, modifiers: mods, lineTotal: calcLineTotal({ ...l, modifiers: mods }) }
          }),
        })),

        removeModifier: (lineId, modId) => set(s => ({
          lines: s.lines.map(l => {
            if (l.lineId !== lineId) return l
            const mods = l.modifiers.filter(m => m.id !== modId)
            return { ...l, modifiers: mods, lineTotal: calcLineTotal({ ...l, modifiers: mods }) }
          }),
        })),

        duplicateLine: (lineId) => set(s => {
          const orig = s.lines.find(l => l.lineId === lineId)
          if (!orig) return s
          return { lines: [...s.lines, { ...orig, lineId: crypto.randomUUID() }] }
        }),

        // ── Order Config ──
        setOrderType: (orderType) => set({ orderType }),
        setTable: (tableNumber) => set({ tableNumber }),
        setCustomer: (customerName, customerPhone = '') => set({ customerName, customerPhone }),
        setDeliveryAddress: (deliveryAddress) => set({ deliveryAddress }),

        // ── Discount ──
        setDiscount: (discountType, discountValue) => set({ discountType, discountValue }),
        clearDiscount: () => set({ discountType: null, discountValue: 0 }),

        // ── Payments ──
        addPayment: (p) => set(s => ({ payments: [...s.payments, p] })),
        removePayment: (idx) => set(s => ({ payments: s.payments.filter((_, i) => i !== idx) })),
        clearPayments: () => set({ payments: [] }),

        // ── UI ──
        setSearch: (searchQuery) => set({ searchQuery }),
        setCategory: (selectedCategory) => set({ selectedCategory }),
        setActiveLine: (activeLineId) => set({ activeLineId }),
        setLang: (lang) => set({ lang }),

        // ── Computed ──
        getSubtotal: () => get().lines.reduce((s, l) => s + l.lineTotal, 0),

        getDiscountAmount: () => {
          const s = get()
          const sub = s.getSubtotal()
          if (!s.discountType || !s.discountValue) return 0
          if (s.discountType === 'percent') return Math.round(sub * s.discountValue / 100)
          return Math.min(s.discountValue, sub)
        },

        getTaxAmount: () => {
          const s = get()
          const base = s.getSubtotal() - s.getDiscountAmount()
          if (base <= 0) return 0
          if (s.taxInclusive) return Math.round(base * s.taxPercent / (100 + s.taxPercent))
          return Math.round(base * s.taxPercent / 100)
        },

        getTotal: () => {
          const s = get()
          const base = s.getSubtotal() - s.getDiscountAmount()
          if (base <= 0) return 0
          if (s.taxInclusive) return base
          return base + s.getTaxAmount()
        },

        getAmountPaid: () => get().payments.reduce((s, p) => s + p.amount, 0),
        getChange: () => Math.max(0, get().getAmountPaid() - get().getTotal()),
        isFullyPaid: () => get().getTotal() > 0 && get().getAmountPaid() >= get().getTotal(),
        getTotalQty: () => get().lines.reduce((s, l) => s + l.qty, 0),

        // ── Reset ──
        clearCart: () => set({
          lines: [], payments: [], discountType: null, discountValue: 0, activeLineId: null,
        }),

        newOrder: () => set({
          lines: [], payments: [], discountType: null, discountValue: 0,
          customerName: 'Guest', customerPhone: '', deliveryAddress: '',
          tableNumber: '', orderType: 'dine_in', activeLineId: null,
          searchQuery: '', selectedCategory: null,
        }),
      }),
      {
        name: 'pos-cart-v1',
        storage: createJSONStorage(() =>
          typeof window !== 'undefined' ? sessionStorage : localStorage
        ),
        partialize: (s) => ({
          lines: s.lines,
          orderType: s.orderType,
          tableNumber: s.tableNumber,
          customerName: s.customerName,
          taxPercent: s.taxPercent,
          taxInclusive: s.taxInclusive,
          discountType: s.discountType,
          discountValue: s.discountValue,
          lang: s.lang,
        }),
      }
    ),
    { name: 'POSStore' }
  )
)
