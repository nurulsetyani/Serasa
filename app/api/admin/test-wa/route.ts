import { NextResponse } from 'next/server'
import { sendOwnerWhatsApp } from '@/lib/whatsapp'

// GET /api/admin/test-wa
// Test WA notification — buka URL ini di browser untuk kirim pesan test
export async function GET() {
  const token   = process.env.FONNTE_TOKEN
  const adminWa = process.env.NEXT_PUBLIC_ADMIN_WA

  if (!token || !adminWa) {
    return NextResponse.json({
      ok: false,
      error: 'FONNTE_TOKEN atau NEXT_PUBLIC_ADMIN_WA belum diset',
      setup: [
        '1. Daftar di https://fonnte.com',
        '2. Connect nomor WhatsApp kamu',
        '3. Copy token dari dashboard Fonnte',
        '4. Tambahkan ke Vercel: Settings → Environment Variables',
        '   FONNTE_TOKEN = <token dari fonnte>',
        '   NEXT_PUBLIC_ADMIN_WA = 62812xxxxxxx (tanpa +, tanpa spasi)',
        '5. Redeploy project',
      ],
    }, { status: 503 })
  }

  await sendOwnerWhatsApp({
    order_number: 'TEST-001',
    source: 'qr',
    table_number: '5',
    customer_name: 'Test Customer',
    order_type: 'dine_in',
    total_price: 45.50,
    items: [
      { name: 'Mie Goreng Ayam', qty: 2 },
      { name: 'Es Teh Manis', qty: 1 },
    ],
  })

  return NextResponse.json({
    ok: true,
    message: `Pesan test dikirim ke ${adminWa}`,
    tip: 'Cek WhatsApp kamu dalam 5 detik',
  })
}
