import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { OrderStatus } from '@/types'

const VALID_STATUSES: OrderStatus[] = ['pending', 'cooking', 'ready', 'delivered']

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
    const { status } = body as { status: OrderStatus }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { client, error } = getClient()
    if (!client) return NextResponse.json({ error }, { status: 503 })

    const { data, error: dbError } = await client
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
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
