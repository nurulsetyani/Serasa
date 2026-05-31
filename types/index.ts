export type Language = 'id' | 'en' | 'ar'
export type OrderStatus =
  // ── New status machine (Foodics-style) ──────────────────────────────
  | 'new'               // QR order masuk, menunggu dapur
  | 'accepted'          // Chef terima di KDS
  | 'preparing'         // Sedang dimasak
  | 'ready'             // Siap di counter dapur
  | 'served'            // Sudah diantar ke meja
  | 'awaiting_payment'  // Menunggu pembayaran
  | 'paid'              // Lunas
  // ── Legacy statuses (order lama, tetap berjalan) ────────────────────
  | 'pending' | 'cooking' | 'delivered' | 'cancelled'

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
  discount_percent?: number   // 0-100, contoh: 20 = diskon 20%
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

export type OrderType = 'dine_in' | 'take_away' | 'delivery'
export type PaymentMethod = 'cash' | 'online' | 'qris'

export interface Order {
  id: string
  restaurant_id: string
  order_number?: string
  table_number: string
  customer_name: string
  customer_phone?: string | null
  order_type?: OrderType
  payment_method?: PaymentMethod
  status: OrderStatus
  source?: string | null
  total_price: number
  delivery_address?: string | null
  platform_order_id?: string | null
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
