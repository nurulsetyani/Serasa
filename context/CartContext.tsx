'use client'

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { CartItem, MenuItem } from '@/types'

interface CartState {
  items: CartItem[]
  promoDiscount: number
}

type CartAction =
  | { type: 'ADD'; payload: MenuItem }
  | { type: 'REMOVE'; payload: string }
  | { type: 'UPDATE_QTY'; payload: { id: string; qty: number } }
  | { type: 'CLEAR' }
  | { type: 'SET_PROMO'; payload: number }
  | { type: 'HYDRATE'; payload: CartState }

interface CartContextValue extends CartState {
  addItem: (item: MenuItem) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  setPromo: (pct: number) => void
  totalItems: number
  hasDrinks: boolean
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
      return { ...state, items: [...state.items, { ...action.payload, qty: 1 }] }
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
    case 'CLEAR':
      return { items: [], promoDiscount: 0 }
    case 'SET_PROMO':
      return { ...state, promoDiscount: action.payload }
    default:
      return state
  }
}

const STORAGE_KEY = 'serasa_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], promoDiscount: 0 })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as CartState
        dispatch({ type: 'HYDRATE', payload: parsed })
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  const addItem = useCallback((item: MenuItem) => dispatch({ type: 'ADD', payload: item }), [])
  const removeItem = useCallback((id: string) => dispatch({ type: 'REMOVE', payload: id }), [])
  const updateQty = useCallback((id: string, qty: number) =>
    dispatch({ type: 'UPDATE_QTY', payload: { id, qty } }), [])
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), [])
  const setPromo = useCallback((pct: number) => dispatch({ type: 'SET_PROMO', payload: pct }), [])

  const totalItems = state.items.reduce((s, i) => s + i.qty, 0)
  const hasDrinks = state.items.some(i => i.category === 'drinks')

  return (
    <CartContext.Provider value={{ ...state, addItem, removeItem, updateQty, clearCart, setPromo, totalItems, hasDrinks }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
