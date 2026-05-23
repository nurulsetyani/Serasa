import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

function generateOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = 'POS-'
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)]
  return result
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      customer_name, table_number, order_type,
      total_price, items,
    } = body

    if (!items?.length) {
      return NextResponse.json({ error: 'Order harus memiliki item' }, { status: 400 })
    }

    let supabase: ReturnType<typeof createAdminClient>
    try { supabase = createAdminClient() }
    catch { return NextResponse.json({ error: 'Database belum dikonfigurasi' }, { status: 503 }) }

    const orderNumber = generateOrderNumber()

    // Insert ke skema yang sudah ada — tanpa kolom baru
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        restaurant_id: RESTAURANT_ID,
        order_number: orderNumber,
        customer_name: customer_name?.trim() || 'Guest',
        table_number: String(table_number || '1'),
        order_type: order_type ?? 'dine_in',
        payment_method: 'cash',
        status: 'pending',
        total_price,
      })
      .select()
      .single()

    if (orderErr || !order) {
      console.error('POS order error:', orderErr)
      return NextResponse.json({ error: 'Gagal membuat order' }, { status: 500 })
    }

    // Insert order items
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

    return NextResponse.json(
      { id: order.id, order_number: order.order_number, status: order.status },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/pos/order error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
