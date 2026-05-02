import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

interface CreateOrderBody {
  customer_name: string
  table_number: string
  order_type?: 'dine_in' | 'take_away'
  payment_method?: 'cash' | 'online' | 'qris'
  notes?: string
  total_price: number
  items: {
    menu_id: string
    name: string
    price: number
    qty: number
    notes?: string | null
  }[]
}

function generateOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = 'ORD-'
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)]
  return result
}

async function sendWhatsApp(order: {
  order_number: string
  table_number: string
  customer_name: string
  order_type: string
  payment_method: string
  total_price: number
  items: { name: string; qty: number }[]
}) {
  const token   = process.env.FONNTE_TOKEN
  const adminWa = process.env.NEXT_PUBLIC_ADMIN_WA
  if (!token || !adminWa) return

  const orderTypeLabel   = order.order_type === 'dine_in' ? 'Dine In' : 'Take Away'
  const paymentLabel     = order.payment_method === 'cash' ? 'Tunai' : order.payment_method === 'qris' ? 'QRIS' : 'Transfer Bank'
  const itemLines        = order.items.map(i => `  ${i.qty}× ${i.name}`).join('\n')

  const message = `🔔 *PESANAN BARU — Serasa Restaurant*

📋 No: ${order.order_number}
🪑 Meja: ${order.table_number}
👤 Nama: ${order.customer_name}
🍽 Jenis: ${orderTypeLabel}
💳 Bayar: ${paymentLabel}

*Item Pesanan:*
${itemLines}

💰 *Total: ${order.total_price} SR*

_Segera proses di dapur_ 👨‍🍳`

  try {
    await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target: adminWa, message }),
    })
  } catch (err) {
    // WA gagal tidak menghentikan order
    console.error('WhatsApp notification failed:', err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderBody = await req.json()

    if (!body.customer_name?.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
    }
    if (!body.items?.length) {
      return NextResponse.json({ error: 'Order must have at least one item' }, { status: 400 })
    }

    let supabase: ReturnType<typeof createAdminClient>
    try {
      supabase = createAdminClient()
    } catch {
      return NextResponse.json({ error: 'Database not configured yet' }, { status: 503 })
    }

    const orderNumber = generateOrderNumber()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: RESTAURANT_ID,
        order_number: orderNumber,
        customer_name: body.customer_name.trim(),
        table_number: body.table_number,
        order_type: body.order_type ?? 'dine_in',
        payment_method: body.payment_method ?? 'cash',
        notes: body.notes?.trim() || null,
        total_price: body.total_price,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    const orderItems = body.items.map(item => ({
      order_id: order.id,
      menu_id: item.menu_id,
      name: item.name,
      price: item.price,
      qty: item.qty,
      notes: item.notes ?? null,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id)
      console.error('Order items error:', itemsError)
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    // Kirim notif WA — tidak menghentikan response meski gagal
    sendWhatsApp({
      order_number: order.order_number ?? orderNumber,
      table_number: order.table_number,
      customer_name: order.customer_name,
      order_type: order.order_type ?? 'dine_in',
      payment_method: order.payment_method ?? 'cash',
      total_price: order.total_price,
      items: body.items,
    })

    return NextResponse.json(
      { id: order.id, order_number: order.order_number, status: order.status },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/order error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
