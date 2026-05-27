import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://serasa-opal.vercel.app'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, order } = body as {
      type: 'cashier' | 'kitchen'
      order: {
        id: string
        order_number?: string
        table_number: string
        customer_name: string
        order_type: string
        payment_method?: string
        total_price: number
        subtotal?: number
        discount_type?: string | null
        discount_value?: number
        discount_amount?: number
        tax_percent?: number
        tax_amount?: number
        payments?: { method: string; amount: number }[]
        created_at: string
        order_items: {
          id: string
          name: string
          name_ar?: string
          price: number
          qty: number
          notes?: string | null
        }[]
      }
    }

    if (!type || !order) {
      return NextResponse.json({ error: 'type and order required' }, { status: 400 })
    }

    let supabase: ReturnType<typeof createAdminClient>
    try { supabase = createAdminClient() }
    catch { return NextResponse.json({ error: 'Database not configured' }, { status: 503 }) }

    const receiptUrl = `${APP_URL}/receipt/${order.id}`

    // Build payload sent to print agent
    const payload = {
      type,
      receipt_url: receiptUrl,
      order: {
        ...order,
        restaurant_name: 'SERASA RESTAURANT',
        restaurant_name_ar: 'مطعم سيراسا',
        restaurant_sub: 'Authentic Indonesian Cuisine',
        restaurant_sub_ar: 'مأكولات إندونيسية أصيلة',
        restaurant_addr: 'Kuday, Mekkah - Saudi Arabia',
        restaurant_addr_ar: 'كداي، مكة المكرمة - المملكة العربية السعودية',
      },
    }

    const { data, error } = await supabase
      .from('print_jobs')
      .insert({
        restaurant_id: RESTAURANT_ID,
        order_id: order.id,
        type,
        status: 'pending',
        payload,
      })
      .select('id')
      .single()

    if (error) {
      console.error('print job insert error:', error)
      return NextResponse.json({ error: 'Failed to create print job' }, { status: 500 })
    }

    return NextResponse.json({ job_id: data.id, status: 'queued' }, { status: 201 })
  } catch (err) {
    console.error('POST /api/print error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
