import { NextRequest, NextResponse } from 'next/server'
import { tapChargeStore } from '@/lib/tap-store'

// POS polls this endpoint every 2s to check if terminal approved payment.
// GET /api/payment/tap/status?chargeId=ch_xxx

export async function GET(req: NextRequest) {
  const chargeId = req.nextUrl.searchParams.get('chargeId') ?? ''

  if (!chargeId) {
    return NextResponse.json({ error: 'Missing chargeId' }, { status: 400 })
  }

  const record = tapChargeStore.get(chargeId)

  if (!record) {
    return NextResponse.json({ status: 'INITIATED' })  // still pending
  }

  return NextResponse.json(record)
}

// POST /api/payment/tap/status — simulate terminal approval (sandbox only)
export async function POST(req: NextRequest) {
  const { chargeId, status = 'CAPTURED' } = await req.json()

  if (!chargeId) {
    return NextResponse.json({ error: 'Missing chargeId' }, { status: 400 })
  }

  tapChargeStore.set(chargeId, {
    status,
    amount: 0,
    currency: 'SAR',
    updatedAt: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, chargeId, status })
}
