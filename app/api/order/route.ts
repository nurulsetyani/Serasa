import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { sendOwnerWhatsApp } from '@/lib/whatsapp'
import { queuePrintJob } from '@/lib/print-jobs'

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

    // Idempotency guard: if an identical order (same table, name, total) was
    // just placed in the last 60s — e.g. double-tap or browser back+resubmit —
    // return that order instead of creating a duplicate.
    const sixtySecondsAgo = new Date(Date.now() - 60_000).toISOString()
    const { data: recentOrder } = await supabase
      .from('orders')
      .select('id, order_number, status')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('table_number', body.table_number)
      .eq('customer_name', body.customer_name.trim())
      .eq('total_price', body.total_price)
      .eq('source', 'qr')
      .gte('created_at', sixtySecondsAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recentOrder) {
      return NextResponse.json(
        { id: recentOrder.id, order_number: recentOrder.order_number, status: recentOrder.status },
        { status: 200 }
      )
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
        source: 'qr',
        status: 'new',
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError?.message, orderError?.details, orderError?.hint)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Drop menu_id references that no longer exist (e.g. menu item edited/recreated
    // while customer had it in their cart) so a stale FK can't block the whole order.
    const menuIds = Array.from(new Set(body.items.map(i => i.menu_id).filter(Boolean)))
    const { data: existingMenu } = menuIds.length
      ? await supabase.from('menu').select('id').in('id', menuIds)
      : { data: [] }
    const validMenuIds = new Set((existingMenu ?? []).map(m => m.id))

    const orderItems = body.items.map(item => ({
      order_id: order.id,
      menu_id: validMenuIds.has(item.menu_id) ? item.menu_id : null,
      name: item.name,
      price: item.price,
      qty: item.qty,
      notes: item.notes ?? null,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id)
      console.error('Order items error:', itemsError.message, itemsError.details, itemsError.hint)
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    sendOwnerWhatsApp({
      order_number: order.order_number ?? orderNumber,
      source: 'qr',
      table_number: order.table_number,
      customer_name: order.customer_name,
      order_type: order.order_type ?? 'dine_in',
      total_price: order.total_price,
      items: body.items,
    })

    // Auto-print kitchen ticket
    await queuePrintJob(supabase, RESTAURANT_ID, 'kitchen', {
      id: order.id,
      order_number: order.order_number,
      table_number: order.table_number,
      customer_name: order.customer_name,
      order_type: order.order_type ?? 'dine_in',
      created_at: order.created_at,
      order_items: orderItems.map(i => ({ name: i.name, qty: i.qty, notes: i.notes })),
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
