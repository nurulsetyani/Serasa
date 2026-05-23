import { NextRequest, NextResponse } from 'next/server'
import { hsAcceptOrder, keetaAcceptOrder } from '@/lib/delivery-platforms'

export async function POST(req: NextRequest) {
  try {
    const { platform, platformOrderId } = await req.json()

    if (!platform || !platformOrderId) {
      return NextResponse.json({ error: 'platform and platformOrderId required' }, { status: 400 })
    }

    if (platform === 'hungerstation') {
      await hsAcceptOrder(platformOrderId)
    } else if (platform === 'keeta') {
      await keetaAcceptOrder(platformOrderId)
    } else {
      return NextResponse.json({ error: 'Unknown platform' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    // Log but don't surface to client — order is already accepted in our DB
    console.error('Delivery accept callback error:', err)
    return NextResponse.json({ ok: true, warning: String(err) })
  }
}
