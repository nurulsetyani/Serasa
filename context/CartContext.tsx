'use client'

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { CartItem, MenuItem } from '@/types'

interface CartState {
  items: CartItem[]
}

type CartAction =
  | { type: 'ADD'; payload: MenuItem; notes?: string }
  | { type: 'REMOVE'; payload: string }
  | { type: 'UPDATE_QTY'; payload: { id: string; qty: number } }
  | { type: 'UPDATE_NOTES'; payload: { id: string; notes: string } }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; payload: CartState }

interface CartContextValue extends CartState {
  addItem: (item: MenuItem, notes?: string) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  updateNotes: (id: string, notes: string) => void
  clearCart: () => void
  totalItems: number
}

const CartContext = createContext<CartContextValue | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload
    case 'ADD': {
      const existing = state.items.find(i => i.id === action.payload.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i
          ),
        }
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, qty: 1, itemNotes: action.notes }],
      }
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) }
    case 'UPDATE_QTY': {
      if (action.payload.qty <= 0) {
        return { ...state, items: state.items.filter(i => i.id !== action.payload.id) }
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload.id ? { ...i, qty: action.payload.qty } : i
        ),
      }
    }
    case 'UPDATE_NOTES':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload.id ? { ...i, itemNotes: action.payload.notes } : i
        ),
      }
    case 'CLEAR':
      return { items: [] }
    default:
      return state
  }
}

const STORAGE_KEY = 'serasa_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) dispatch({ type: 'HYDRATE', payload: JSON.parse(saved) as CartState })
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
  }, [state])

  const addItem = useCallback(
    (item: MenuItem, notes?: string) => dispatch({ type: 'ADD', payload: item, notes }),
    []
  )
  const removeItem = useCallback((id: string) => dispatch({ type: 'REMOVE', payload: id }), [])
  const updateQty = useCallback(
    (id: string, qty: number) => dispatch({ type: 'UPDATE_QTY', payload: { id, qty } }),
    []
  )
  const updateNotes = useCallback(
    (id: string, notes: string) => dispatch({ type: 'UPDATE_NOTES', payload: { id, notes } }),
    []
  )
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), [])
  const totalItems = state.items.reduce((s, i) => s + i.qty, 0)

  return (
    <CartContext.Provider value={{ ...state, addItem, removeItem, updateQty, updateNotes, clearCart, totalItems }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
