import { NextRequest, NextResponse } from 'next/server'
import { hsMarkReady, keetaMarkReady } from '@/lib/delivery-platforms'

export async function POST(req: NextRequest) {
  try {
    const { platform, platformOrderId } = await req.json()

    if (!platform || !platformOrderId) {
      return NextResponse.json({ error: 'platform and platformOrderId required' }, { status: 400 })
    }

    if (platform === 'hungerstation') {
      await hsMarkReady(platformOrderId)
    } else if (platform === 'keeta') {
      await keetaMarkReady(platformOrderId)
    } else {
      return NextResponse.json({ error: 'Unknown platform' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delivery ready callback error:', err)
    return NextResponse.json({ ok: true, warning: String(err) })
  }
}
