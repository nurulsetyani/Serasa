import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Tap sends POST to this URL when payment status changes.
// Configure in Tap Dashboard → Developers → Webhooks → Add URL:
//   https://serasa-opal.vercel.app/api/payment/tap/webhook

const TAP_WEBHOOK_SECRET = process.env.TAP_WEBHOOK_SECRET ?? ''

// In-memory store for charge status (resets on cold start).
// For production: use Redis or Supabase instead.
export const chargeStore = new Map<string, {
  status: 'INITIATED' | 'CAPTURED' | 'DECLINED' | 'CANCELLED' | 'FAILED'
  amount: number
  currency: string
  updatedAt: string
}>()

function verifySignature(rawBody: string, signature: string): boolean {
  if (!TAP_WEBHOOK_SECRET) return true  // skip in sandbox mode
  const expected = crypto.createHmac('sha256', TAP_WEBHOOK_SECRET).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('hashstring') ?? req.headers.get('x-tap-signature') ?? ''

  if (!verifySignature(rawBody, sig)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const chargeId = String(payload.id ?? '')
  const status   = String(payload.status ?? '')

  if (!chargeId) {
    return NextResponse.json({ ok: true })
  }

  // Map Tap status to our internal status
  const mapped = (
    status === 'CAPTURED' ? 'CAPTURED' :
    status === 'DECLINED' ? 'DECLINED' :
    status === 'CANCELLED' ? 'CANCELLED' :
    status === 'FAILED' ? 'FAILED' :
    'INITIATED'
  ) as 'INITIATED' | 'CAPTURED' | 'DECLINED' | 'CANCELLED' | 'FAILED'

  chargeStore.set(chargeId, {
    status: mapped,
    amount: Number(payload.amount ?? 0),
    currency: String(payload.currency ?? 'SAR'),
    updatedAt: new Date().toISOString(),
  })

  console.log(`[Tap webhook] charge ${chargeId} → ${mapped}`)

  return NextResponse.json({ ok: true })
}
