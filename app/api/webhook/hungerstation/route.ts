import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase'
import { sendOwnerWhatsApp } from '@/lib/whatsapp'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.HUNGERSTATION_WEBHOOK_SECRET
  if (!secret) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

function generateOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let r = 'HS-'
  for (let i = 0; i < 6; i++) r += chars[Math.floor(Math.random() * chars.length)]
  return r
}

/**
 * Normalize HungerStation webhook payload → internal order shape.
 *
 * Adjust field paths below to match exact payload from HungerStation docs.
 * Reference: https://partner-portal.hungerstation.com/docs/webhooks
 */
function normalizePayload(payload: Record<string, unknown>) {
  const order = (payload.order ?? payload) as Record<string, unknown>
  const customer = (order.customer ?? {}) as Record<string, unknown>
  const address = (order.deliveryAddress ?? order.address ?? {}) as Record<string, unknown>
  const items = (order.items ?? order.lineItems ?? []) as Record<string, unknown>[]

  const deliveryParts = [address.street, address.district, address.city].filter(Boolean)
  const deliveryAddress = deliveryParts.length
    ? deliveryParts.join(', ')
    : typeof order.deliveryAddress === 'string' ? order.deliveryAddress : null

  return {
    platformOrderId: String(order.id ?? order.orderId ?? ''),
    customerName: String(customer.name ?? order.customerName ?? 'HungerStation Customer'),
    customerPhone: String(customer.phone ?? customer.mobile ?? '') || null,
    deliveryAddress: deliveryAddress as string | null,
    total: Number(order.total ?? order.grandTotal ?? order.totalPrice ?? 0),
    subtotal: Number(order.subtotal ?? order.subTotal ?? 0),
    createdAt: String(order.createdAt ?? order.orderTime ?? new Date().toISOString()),
    items: items.map((it) => ({
      name: String(it.name ?? it.itemName ?? it.title ?? 'Item'),
      price: Number(it.unitPrice ?? it.price ?? 0),
      qty: Number(it.quantity ?? it.qty ?? 1),
      notes: (it.notes ?? it.specialInstructions ?? null) as string | null,
    })),
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Verify HMAC signature
  const sig = req.headers.get('x-hungerstation-signature') ?? ''
  if (!verifySignature(rawBody, sig)) {
    console.error('HungerStation webhook: invalid signature')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only process new order events
  const event = String(payload.event ?? payload.type ?? 'order.created')
  if (!event.toLowerCase().includes('order')) {
    return NextResponse.json({ ok: true })
  }

  const norm = normalizePayload(payload)
  if (!norm.platformOrderId) {
    return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()

    // Idempotency — skip if already received
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('platform_order_id', norm.platformOrderId)
      .eq('restaurant_id', RESTAURANT_ID)
    if ((count ?? 0) > 0) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const orderNumber = generateOrderNumber()

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        restaurant_id: RESTAURANT_ID,
        order_number: orderNumber,
        platform_order_id: norm.platformOrderId,
        customer_name: norm.customerName,
        customer_phone: norm.customerPhone,
        table_number: 'Delivery',
        order_type: 'delivery',
        delivery_address: norm.deliveryAddress,
        payment_method: 'online',
        status: 'new',
        source: 'hungerstation',
        total_price: norm.total,
        subtotal: norm.subtotal || norm.total,
        tax_percent: 0,
        tax_amount: 0,
        discount_amount: 0,
        created_at: norm.createdAt,
      })
      .select('id')
      .single()

    if (orderErr || !order) {
      console.error('HungerStation order insert error:', orderErr)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    if (norm.items.length) {
      await supabase.from('order_items').insert(
        norm.items.map((it) => ({
          order_id: order.id,
          menu_id: null,
          name: it.name,
          price: it.price,
          qty: it.qty,
          notes: it.notes,
        }))
      )
    }

    sendOwnerWhatsApp({
      order_number: orderNumber,
      source: 'hungerstation',
      customer_name: norm.customerName,
      order_type: 'delivery',
      total_price: norm.total,
      items: norm.items,
    })

    return NextResponse.json({ ok: true, order_id: order.id }, { status: 201 })
  } catch (err) {
    console.error('HungerStation webhook error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
