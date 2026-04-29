import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

interface CreateOrderBody {
  customer_name: string
  table_number: string
  notes?: string
  total_price: number
  items: {
    menu_id: string
    name: string
    price: number
    qty: number
  }[]
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

    const supabase = createAdminClient()

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: RESTAURANT_ID,
        customer_name: body.customer_name.trim(),
        table_number: body.table_number,
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

    // Create order items
    const orderItems = body.items.map(item => ({
      order_id: order.id,
      menu_id: item.menu_id,
      name: item.name,
      price: item.price,
      qty: item.qty,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

    if (itemsError) {
      // Rollback: delete the order
      await supabase.from('orders').delete().eq('id', order.id)
      console.error('Order items error:', itemsError)
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    return NextResponse.json({ id: order.id, status: order.status }, { status: 201 })
  } catch (err) {
    console.error('POST /api/order error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
