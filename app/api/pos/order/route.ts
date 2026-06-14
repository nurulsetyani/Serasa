import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { queuePrintJob } from '@/lib/print-jobs'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

function generateOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = 'POS-'
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)]
  return result
}

// POS supports cash + bank transfer — map onto the
// 'cash' | 'online' | 'qris' values allowed by orders.payment_method.
function mapPaymentMethod(method: string | undefined): 'cash' | 'online' | 'qris' {
  return method === 'cash' || !method ? 'cash' : 'online'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      customer_name, table_number, order_type, payment_method,
      total_price, items,
      subtotal, discount_type, discount_value, discount_amount,
      tax_percent, tax_amount,
    } = body
    // delivery fields — columns added via migration
    const customer_phone: string | null = body.customer_phone?.trim() || null
    const delivery_address: string | null = body.delivery_address?.trim() || null

    if (!items?.length) {
      return NextResponse.json({ error: 'Order harus memiliki item' }, { status: 400 })
    }

    let supabase: ReturnType<typeof createAdminClient>
    try { supabase = createAdminClient() }
    catch { return NextResponse.json({ error: 'Database belum dikonfigurasi' }, { status: 503 }) }

    const orderNumber = generateOrderNumber()

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        restaurant_id: RESTAURANT_ID,
        order_number: orderNumber,
        customer_name: customer_name?.trim() || 'Guest',
        customer_phone,
        table_number: String(table_number || '1'),
        order_type: order_type ?? 'dine_in',
        delivery_address,
        payment_method: mapPaymentMethod(payment_method),
        status: 'paid',
        source: 'pos',
        total_price,
        subtotal: subtotal ?? total_price,
        discount_type: discount_type ?? null,
        discount_value: discount_value ?? 0,
        discount_amount: discount_amount ?? 0,
        tax_percent: tax_percent ?? 15,
        tax_amount: tax_amount ?? 0,
      })
      .select()
      .single()

    if (orderErr || !order) {
      console.error('POS order error:', orderErr)
      return NextResponse.json({ error: 'Gagal membuat order' }, { status: 500 })
    }

    const orderItems = items.map((item: {
      menu_id: string; name: string; price: number; qty: number; notes?: string | null
    }) => ({
      order_id: order.id,
      menu_id: item.menu_id,
      name: item.name,
      price: item.price,
      qty: item.qty,
      notes: item.notes ?? null,
    }))

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsErr) {
      await supabase.from('orders').delete().eq('id', order.id)
      console.error('POS items error:', itemsErr)
      return NextResponse.json({ error: 'Gagal menyimpan item' }, { status: 500 })
    }

    // Auto-print kitchen ticket
    await queuePrintJob(supabase, RESTAURANT_ID, 'kitchen', {
      id: order.id,
      order_number: order.order_number,
      table_number: order.table_number,
      customer_name: order.customer_name,
      order_type: order.order_type ?? 'dine_in',
      created_at: order.created_at,
      order_items: orderItems.map((i: { name: string; qty: number; notes?: string | null }) => ({
        name: i.name, qty: i.qty, notes: i.notes,
      })),
    })

    return NextResponse.json(
      { id: order.id, order_number: order.order_number, status: order.status, created_at: order.created_at },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/pos/order error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
