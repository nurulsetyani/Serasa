import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { order_id, rating, review } = body

    if (!order_id) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 })
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    let supabase: ReturnType<typeof createAdminClient>
    try {
      supabase = createAdminClient()
    } catch {
      return NextResponse.json({ error: 'Database not configured yet' }, { status: 503 })
    }

    // Verify order exists and is delivered
    const { data: order } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', order_id)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({ order_id, rating, review: review?.trim() || null })
      .select()
      .single()

    if (error) {
      console.error('Review creation error:', error)
      return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('POST /api/review error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
