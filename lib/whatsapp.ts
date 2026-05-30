// WhatsApp notification via Fonnte (https://fonnte.com)
// Setup: daftar fonnte.com → connect WA → copy token
// Env vars: FONNTE_TOKEN, NEXT_PUBLIC_ADMIN_WA (format: 62812xxxx)

const FONNTE_URL = 'https://api.fonnte.com/send'

export interface WAOrderPayload {
  order_number: string
  source: string          // 'qr' | 'pos' | 'hungerstation' | 'keeta'
  table_number?: string
  customer_name: string
  order_type: string
  total_price: number
  items: { name: string; qty: number }[]
}

const SOURCE_LABEL: Record<string, string> = {
  qr:            '📱 QR Scan',
  pos:           '🖥 POS Kasir',
  hungerstation: '🍔 HungerStation',
  keeta:         '🛵 Keeta',
}

export async function sendOwnerWhatsApp(order: WAOrderPayload): Promise<void> {
  const token   = process.env.FONNTE_TOKEN
  const adminWa = process.env.NEXT_PUBLIC_ADMIN_WA
  if (!token || !adminWa) return  // silently skip if not configured

  const srcLabel   = SOURCE_LABEL[order.source] ?? order.source
  const typeLabel  = order.order_type === 'dine_in' ? 'Dine In'
                   : order.order_type === 'take_away' ? 'Take Away'
                   : 'Delivery'
  const tableInfo  = order.order_type === 'delivery' || !order.table_number
                   ? `📦 ${typeLabel}`
                   : `🪑 Meja ${order.table_number} (${typeLabel})`
  const itemLines  = order.items.map(i => `  • ${i.qty}× ${i.name}`).join('\n')

  const message = `🔔 *ORDER BARU — Serasa Restaurant*

📋 No: *${order.order_number}*
${tableInfo}
👤 ${order.customer_name}
🏪 Via: ${srcLabel}

*Item:*
${itemLines}

💰 *Total: ${order.total_price.toFixed(2)} SAR*

_Segera proses di POS / dapur_ 👨‍🍳`

  try {
    const res = await fetch(FONNTE_URL, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: adminWa, message }),
    })
    if (!res.ok) {
      const text = await res.text()
      console.warn('[WA] Fonnte error:', res.status, text)
    }
  } catch (err) {
    // WA gagal tidak menghentikan proses order
    console.error('[WA] sendOwnerWhatsApp failed:', err)
  }
}
