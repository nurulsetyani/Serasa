import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { queuePrintJob, PrintOrder } from '@/lib/print-jobs'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, order } = body as { type: 'cashier' | 'kitchen'; order: PrintOrder }

    if (!type || !order) {
      return NextResponse.json({ error: 'type and order required' }, { status: 400 })
    }

    let supabase: ReturnType<typeof createAdminClient>
    try { supabase = createAdminClient() }
    catch { return NextResponse.json({ error: 'Database not configured' }, { status: 503 }) }

    const jobId = await queuePrintJob(supabase, RESTAURANT_ID, type, order)
    if (!jobId) {
      return NextResponse.json({ error: 'Failed to create print job' }, { status: 500 })
    }

    return NextResponse.json({ job_id: jobId, status: 'queued' }, { status: 201 })
  } catch (err) {
    console.error('POST /api/print error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
