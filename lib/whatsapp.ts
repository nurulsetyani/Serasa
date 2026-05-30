// WhatsApp notification via self-hosted Baileys bot (wa-bot/)
// Bot dihost di Render.com (gratis), dijaga hidup oleh UptimeRobot (gratis)
//
// Env vars yang dibutuhkan di Vercel:
//   WA_BOT_URL    = https://serasa-wa-bot.onrender.com   (URL Render kamu)
//   WA_BOT_SECRET = password-rahasia-sama-dengan-BOT_SECRET-di-bot
//   NEXT_PUBLIC_ADMIN_WA = 62812xxxxxxx  (nomor HP owner, tanpa + atau spasi)

export interface WAOrderPayload {
  order_number: string
  source: string          // 'qr' | 'hungerstation' | 'keeta'
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
  const botUrl    = process.env.WA_BOT_URL
  const botSecret = process.env.WA_BOT_SECRET
  const adminWa   = process.env.NEXT_PUBLIC_ADMIN_WA

  if (!botUrl || !adminWa) return  // skip jika belum dikonfigurasi

  const srcLabel  = SOURCE_LABEL[order.source] ?? order.source
  const typeLabel = order.order_type === 'dine_in'  ? 'Dine In'
                  : order.order_type === 'take_away' ? 'Take Away'
                  : 'Delivery'
  const tableInfo = order.order_type === 'delivery' || !order.table_number
                  ? `📦 ${typeLabel}`
                  : `🪑 Meja ${order.table_number} (${typeLabel})`
  const itemLines = order.items.map(i => `  • ${i.qty}× ${i.name}`).join('\n')

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
    const res = await fetch(`${botUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-secret': botSecret ?? '',
      },
      body: JSON.stringify({ phone: adminWa, message }),
    })
    if (!res.ok) {
      const text = await res.text()
      console.warn('[WA] Bot error:', res.status, text)
    }
  } catch (err) {
    // Gagal kirim WA tidak menghentikan proses order
    console.error('[WA] sendOwnerWhatsApp failed:', err)
  }
}
