import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const ADDABLE = ['new', 'accepted', 'preparing', 'ready', 'pending', 'cooking']

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = createAdminClient()
    const body = await req.json()
    const items = body.items as {
      menu_id?: string; name: string; price: number; qty: number; notes?: string
    }[]

    if (!items?.length) {
      return NextResponse.json({ error: 'Minimal 1 item diperlukan' }, { status: 400 })
    }

    const { data: order, error: orderErr } = await client
      .from('orders')
      .select('id, status, total_price')
      .eq('id', params.id)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    if (!ADDABLE.includes(order.status)) {
      return NextResponse.json(
        { error: 'Pesanan sudah tidak bisa ditambah item' },
        { status: 409 }
      )
    }

    const { error: insertErr } = await client.from('order_items').insert(
      items.map(i => ({
        order_id: params.id,
        menu_id: i.menu_id || null,
        name: i.name,
        price: i.price,
        qty: i.qty,
        notes: i.notes || null,
      }))
    )

    if (insertErr) {
      return NextResponse.json({ error: 'Gagal menambah item' }, { status: 500 })
    }

    // Recalculate total from all non-cancelled items
    const { data: allItems } = await client
      .from('order_items')
      .select('price, qty')
      .eq('order_id', params.id)
      .eq('cancelled', false)

    const newTotal = (allItems ?? []).reduce((s, i) => s + Number(i.price) * i.qty, 0)

    // Touch updated_at → triggers KDS realtime UPDATE event with latest items
    await client
      .from('orders')
      .update({ total_price: newTotal, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    return NextResponse.json({ success: true, newTotal })
  } catch (err) {
    console.error('POST /api/order/[id]/items error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
