import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const client = createAdminClient()

    // 1. Fetch order — must be status 'new' to allow cancellation
    const { data: order, error: orderErr } = await client
      .from('orders')
      .select('id, status, total_price')
      .eq('id', params.id)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (order.status !== 'new') {
      return NextResponse.json(
        { error: 'Pesanan sudah diproses dapur, tidak bisa diubah' },
        { status: 409 }
      )
    }

    // 2. Soft-delete the item
    const { error: itemErr } = await client
      .from('order_items')
      .update({ cancelled: true })
      .eq('id', params.itemId)
      .eq('order_id', params.id)

    if (itemErr) {
      return NextResponse.json({ error: 'Failed to cancel item' }, { status: 500 })
    }

    // 3. Fetch remaining active items
    const { data: remaining } = await client
      .from('order_items')
      .select('price, qty')
      .eq('order_id', params.id)
      .eq('cancelled', false)

    const allCancelled = !remaining || remaining.length === 0

    if (allCancelled) {
      // 4a. No items left — cancel the whole order
      await client
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', params.id)

      return NextResponse.json({ cancelled: true, orderCancelled: true })
    }

    // 4b. Recalculate total and touch updated_at (triggers KDS realtime)
    const newTotal = remaining!.reduce((sum, i) => sum + Number(i.price) * i.qty, 0)

    const { error: updateErr } = await client
      .from('orders')
      .update({ total_price: newTotal, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    if (updateErr) {
      console.error('Failed to recalculate total:', updateErr)
      return NextResponse.json({ error: 'Gagal update total harga' }, { status: 500 })
    }

    return NextResponse.json({ cancelled: true, orderCancelled: false, newTotal })
  } catch (err) {
    console.error('DELETE /api/order/[id]/item/[itemId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
