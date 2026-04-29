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
  promo_price?: number
  cook_time: number
  image: string
  is_best_seller: boolean
  category: string
  is_available?: boolean
}

export interface CartItem extends MenuItem {
  qty: number
}

export interface Order {
  id: string
  restaurant_id: string
  table_number: string
  customer_name: string
  status: OrderStatus
  total_price: number
  notes?: string
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
}

export interface Review {
  id: string
  order_id: string
  rating: number
  review: string
  created_at: string
}
