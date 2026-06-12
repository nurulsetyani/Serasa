import { SupabaseClient } from '@supabase/supabase-js'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://serasa-opal.vercel.app'

const RESTAURANT_INFO = {
  restaurant_name: 'SERASA RESTAURANT',
  restaurant_name_ar: 'مطعم سيراسا',
  restaurant_sub: 'Authentic Indonesian Cuisine',
  restaurant_sub_ar: 'مأكولات إندونيسية أصيلة',
  restaurant_addr: 'Kuday, Mekkah - Saudi Arabia',
  restaurant_addr_ar: 'كداي، مكة المكرمة - المملكة العربية السعودية',
}

export interface PrintOrderItem {
  id?: string
  name: string
  name_ar?: string
  price?: number
  qty: number
  notes?: string | null
}

export interface PrintOrder {
  id: string
  order_number?: string
  table_number: string
  customer_name: string
  order_type: string
  payment_method?: string
  notes?: string | null
  total_price?: number
  subtotal?: number
  discount_type?: string | null
  discount_value?: number
  discount_amount?: number
  tax_percent?: number
  tax_amount?: number
  payments?: { method: string; amount: number }[]
  created_at: string
  order_items: PrintOrderItem[]
}

/** Queues a print job (cashier receipt or kitchen ticket) for the print-agent to pick up. Returns the job id, or null on failure. */
export async function queuePrintJob(
  supabase: SupabaseClient,
  restaurantId: string,
  type: 'cashier' | 'kitchen',
  order: PrintOrder
): Promise<string | null> {
  const payload = {
    type,
    receipt_url: `${APP_URL}/receipt/${order.id}`,
    order: { ...order, ...RESTAURANT_INFO },
  }

  const { data, error } = await supabase
    .from('print_jobs')
    .insert({
      restaurant_id: restaurantId,
      order_id: order.id,
      type,
      status: 'pending',
      payload,
    })
    .select('id')
    .single()

  if (error) {
    console.error(`print_jobs insert (${type}) error:`, error)
    return null
  }

  return data.id
}
