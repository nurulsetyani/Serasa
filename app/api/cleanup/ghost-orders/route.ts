import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// Orders stuck in 'new' for longer than this get auto-cancelled
const GHOST_TIMEOUT_MINS = 15

// Orders stuck in 'awaiting_payment' for longer than this get auto-cancelled
const STALE_PAYMENT_TIMEOUT_MINS = 120

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

export async function POST() {
  try {
    let supabase: ReturnType<typeof createAdminClient>
    try {
      supabase = createAdminClient()
    } catch {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const ghostCutoff = new Date(Date.now() - GHOST_TIMEOUT_MINS * 60 * 1000).toISOString()
    const staleCutoff = new Date(Date.now() - STALE_PAYMENT_TIMEOUT_MINS * 60 * 1000).toISOString()

    const { data: ghostData, error: ghostError } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('status', 'new')
      .lt('created_at', ghostCutoff)
      .select('id, order_number, source, table_number, customer_name')

    if (ghostError) {
      console.error('Ghost orders cleanup error:', ghostError)
      return NextResponse.json({ error: ghostError.message }, { status: 500 })
    }

    const { data: staleData, error: staleError } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('status', 'awaiting_payment')
      .lt('created_at', staleCutoff)
      .select('id, order_number, source, table_number, customer_name')

    if (staleError) {
      console.error('Stale payment cleanup error:', staleError)
      return NextResponse.json({ error: staleError.message }, { status: 500 })
    }

    const cancelled = [...(ghostData ?? []), ...(staleData ?? [])]
    if (cancelled.length > 0) {
      console.log(`[ghost-orders] Auto-cancelled ${cancelled.length} stale orders:`, cancelled.map(o => o.order_number))
    }

    return NextResponse.json({ cancelled: cancelled.length, orders: cancelled })
  } catch (err) {
    console.error('Ghost orders cleanup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
