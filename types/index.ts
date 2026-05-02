export type Language = 'id' | 'en' | 'ar'
export type OrderStatus = 'pending' | 'cooking' | 'ready' | 'delivered'

export interface Restaurant {
  id: string
  name: string
}

export interface MenuItem {
  id: string
  restaurant_id: string
  name_id: string
  name_en: string
  name_ar: string
  description_id?: string
  description_en?: string
  description_ar?: string
  price: number
  cook_time: number
  calories?: number
  image: string
  is_best_seller: boolean
  category: string
  is_available?: boolean
}

export interface CartItem extends MenuItem {
  qty: number
  itemNotes?: string
}

export type OrderType = 'dine_in' | 'take_away'
export type PaymentMethod = 'cash' | 'online' | 'qris'

export interface Order {
  id: string
  restaurant_id: string
  order_number?: string
  table_number: string
  customer_name: string
  order_type?: OrderType
  payment_method?: PaymentMethod
  status: OrderStatus
  total_price: number
  created_at: string
  updated_at?: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_id: string
  name: string
  price: number
  qty: number
  notes?: string
}

export interface Review {
  id: string
  order_id: string
  rating: number
  review: string
  created_at: string
}
