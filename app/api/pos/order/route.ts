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
      subtotal, discount_type, discount_value, discount_amount,
      tax_percent, tax_amount, total_price,
      items, source = 'pos',
    } = body

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
        table_number: String(table_number || '1'),
        order_type: order_type ?? 'dine_in',
        payment_method: 'cash',
        status: 'pending',
        source,
        subtotal: subtotal ?? total_price,
        discount_type: discount_type ?? null,
        discount_value: discount_value ?? 0,
        discount_amount: discount_amount ?? 0,
        tax_percent: tax_percent ?? 15,
        tax_amount: tax_amount ?? 0,
        total_price,
      })
      .select()
      .single()

    if (orderErr || !order) {
      console.error('POS order error:', orderErr)
      return NextResponse.json({ error: 'Gagal membuat order' }, { status: 500 })
    }

    const orderItems = items.map((item: { menu_id: string; name: string; price: number; qty: number; notes?: string | null; modifiers?: { id: string; name: string; priceAdj: number }[] }) => ({
      order_id: order.id,
      menu_id: item.menu_id,
      name: item.name,
      price: item.price,
      qty: item.qty,
      notes: item.notes ?? null,
      unit_price: item.price,
      modifier_total: (item.modifiers ?? []).reduce((s: number, m: { priceAdj: number }) => s + m.priceAdj, 0),
      line_total: (item.price + (item.modifiers ?? []).reduce((s: number, m: { priceAdj: number }) => s + m.priceAdj, 0)) * item.qty,
    }))

    const { data: createdItems, error: itemsErr } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select()

    if (itemsErr) {
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Gagal menyimpan item' }, { status: 500 })
    }

    // Insert modifier records jika ada
    const modifierInserts: object[] = []
    items.forEach((item: { modifiers?: { id: string; name: string; priceAdj: number }[] }, idx: number) => {
      const createdItem = createdItems?.[idx]
      if (!createdItem || !item.modifiers?.length) return
      item.modifiers.forEach(mod => {
        modifierInserts.push({
          order_item_id: createdItem.id,
          modifier_id: mod.id,
          name: mod.name,
          price_adj: mod.priceAdj,
        })
      })
    })
    if (modifierInserts.length > 0) {
      await supabase.from('order_item_modifiers').insert(modifierInserts)
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
