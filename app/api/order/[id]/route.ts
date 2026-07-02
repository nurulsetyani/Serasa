import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { OrderStatus } from '@/types'

const VALID_STATUSES: OrderStatus[] = [
  'new', 'accepted', 'preparing', 'ready', 'served', 'awaiting_payment', 'paid',
  'pending', 'cooking', 'delivered', 'cancelled',
]

function getClient() {
  try {
    return { client: createAdminClient(), error: null }
  } catch {
    return { client: null, error: 'Database not configured yet' }
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { client, error } = getClient()
    if (!client) return NextResponse.json({ error }, { status: 503 })

    const { data, error: dbError } = await client
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', params.id)
      .single()

    if (dbError || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('GET /api/order/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { status, total_price } = body as { status: OrderStatus; total_price?: number }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { client, error } = getClient()
    if (!client) return NextResponse.json({ error }, { status: 503 })

    const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (typeof total_price === 'number' && total_price > 0) {
      updateData.total_price = total_price
    }

    const { data, error: dbError } = await client
      .from('orders')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (dbError || !data) {
      return NextResponse.json({ error: 'Order not found or update failed' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('PATCH /api/order/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { client, error } = getClient()
    if (!client) return NextResponse.json({ error }, { status: 503 })

    const { error: dbError } = await client
      .from('orders')
      .delete()
      .eq('id', params.id)

    if (dbError) {
      return NextResponse.json({ error: 'Gagal menghapus pesanan' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/order/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
