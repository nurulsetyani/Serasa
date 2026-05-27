import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// Orders stuck in 'new' for longer than this get auto-cancelled
const GHOST_TIMEOUT_MINS = 15

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

export async function POST() {
  try {
    let supabase: ReturnType<typeof createAdminClient>
    try {
      supabase = createAdminClient()
    } catch {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const cutoff = new Date(Date.now() - GHOST_TIMEOUT_MINS * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('status', 'new')
      .lt('created_at', cutoff)
      .select('id, order_number, source, table_number, customer_name')

    if (error) {
      console.error('Ghost orders cleanup error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const count = data?.length ?? 0
    if (count > 0) {
      console.log(`[ghost-orders] Auto-cancelled ${count} stale orders:`, data?.map(o => o.order_number))
    }

    return NextResponse.json({ cancelled: count, orders: data ?? [] })
  } catch (err) {
    console.error('Ghost orders cleanup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
