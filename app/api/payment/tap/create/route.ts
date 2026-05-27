import { NextRequest, NextResponse } from 'next/server'

// Tap Payments sandbox: https://api.tap.company/v2/
// Get sandbox keys at: tap.company → Dashboard → Developers → API Keys
const TAP_SECRET = process.env.TAP_SECRET_KEY ?? ''
const TAP_BASE   = 'https://api.tap.company/v2'

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'SAR', orderId, description, customerName } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // ── SANDBOX MODE (no real TAP_SECRET_KEY) ──────────────────────────────
    if (!TAP_SECRET || TAP_SECRET === 'sk_test_placeholder') {
      // Return mock charge for testing without a real Tap account
      const mockChargeId = `ch_mock_${Date.now()}`
      return NextResponse.json({
        sandbox: true,
        id: mockChargeId,
        status: 'INITIATED',
        amount,
        currency,
        redirect: null,
        message: 'Sandbox mode — no real terminal needed. Use /api/payment/tap/webhook to simulate approval.',
      })
    }

    // ── REAL TAP API ────────────────────────────────────────────────────────
    const body = {
      amount,
      currency,
      customer: {
        first_name: customerName?.split(' ')[0] ?? 'Guest',
        last_name:  customerName?.split(' ').slice(1).join(' ') || 'Customer',
      },
      source: { id: 'src_all' },          // accept all card types incl. Mada
      redirect: {
        url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://serasa-opal.vercel.app'}/pos`,
      },
      reference: { transaction: orderId ?? `ORD-${Date.now()}` },
      description: description ?? 'Serasa Restaurant',
      metadata: { order_id: orderId },
    }

    const res = await fetch(`${TAP_BASE}/charges`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TAP_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Tap charge error:', data)
      return NextResponse.json({ error: data?.errors?.[0]?.description ?? 'Tap API error' }, { status: 502 })
    }

    return NextResponse.json({
      sandbox: false,
      id: data.id,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      redirect: data.transaction?.url ?? null,
    })

  } catch (err) {
    console.error('Tap create error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
