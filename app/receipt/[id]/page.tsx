'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle, Download } from 'lucide-react'
import { Order } from '@/types'
import { formatPrice } from '@/lib/utils'
import { Language } from '@/types'

const MOCK_ORDER: Order = {
  id: 'mock-preview-order',
  restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
  order_number: 'ORD-DEMO1',
  table_number: '3',
  customer_name: 'Ahmad',
  order_type: 'dine_in',
  payment_method: 'cash',
  status: 'delivered',
  total_price: 62,
  created_at: new Date().toISOString(),
  order_items: [
    { id: 'oi-1', order_id: 'mock-preview-order', menu_id: 'm1', name: 'Mie Goreng Ayam', price: 25, qty: 2 },
    { id: 'oi-2', order_id: 'mock-preview-order', menu_id: 'm9', name: 'Es Cendol', price: 12, qty: 1 },
  ],
}

// ── Multilingual labels ────────────────────────────────────
const LABELS: Record<Language, {
  receipt: string; orderId: string; date: string; table: string
  name: string; type: string; payment: string; order: string
  total: string; status: string; thanks: string; tagline: string
  dineIn: string; takeAway: string; cash: string; online: string; qris: string
  done: string; downloading: string; download: string
  paid: string
}> = {
  id: {
    receipt: 'STRUK PEMBAYARAN', orderId: 'No. Pesanan', date: 'Tanggal',
    table: 'Meja', name: 'Nama', type: 'Jenis', payment: 'Pembayaran',
    order: 'Pesanan', total: 'TOTAL', status: 'Status', thanks: 'Terima Kasih! 🙏',
    tagline: 'Semoga sehat selalu & selamat menikmati',
    dineIn: 'Dine In', takeAway: 'Bawa Pulang', cash: 'Tunai',
    online: 'Transfer Bank', qris: 'QRIS', done: 'Tersimpan!',
    downloading: 'Memproses...', download: 'Download Struk', paid: 'Lunas',
  },
  en: {
    receipt: 'PAYMENT RECEIPT', orderId: 'Order No.', date: 'Date',
    table: 'Table', name: 'Name', type: 'Type', payment: 'Payment',
    order: 'Order', total: 'TOTAL', status: 'Status', thanks: 'Thank You! 🙏',
    tagline: 'We hope you enjoy your meal & feel great!',
    dineIn: 'Dine In', takeAway: 'Take Away', cash: 'Cash',
    online: 'Bank Transfer', qris: 'QRIS', done: 'Saved!',
    downloading: 'Processing...', download: 'Download Receipt', paid: 'Paid',
  },
  ar: {
    receipt: 'إيصال الدفع', orderId: 'رقم الطلب', date: 'التاريخ',
    table: 'الطاولة', name: 'الاسم', type: 'النوع', payment: 'الدفع',
    order: 'الطلب', total: 'الإجمالي', status: 'الحالة', thanks: 'شكراً لك! 🙏',
    tagline: 'بالهناء والشفاء — نتمنى لك وجبة شهية!',
    dineIn: 'تناول في المطعم', takeAway: 'سفري', cash: 'نقداً',
    online: 'تحويل بنكي', qris: 'QRIS', done: 'تم الحفظ!',
    downloading: 'جارٍ المعالجة...', download: 'تحميل الإيصال', paid: 'مدفوع',
  },
}

function formatDateTime(iso: string, lang: Language) {
  const locale = lang === 'ar' ? 'ar-SA' : lang === 'id' ? 'id-ID' : 'en-US'
  return new Date(iso).toLocaleString(locale, {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ReceiptPage() {
  const { id }         = useParams<{ id: string }>()
  const [order, setOrder]     = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDown] = useState(false)
  const [done, setDone]        = useState(false)
  const [lang, setLang]        = useState<Language>('id')

  useEffect(() => {
    // Read language from localStorage
    try {
      const saved = localStorage.getItem('serasa_lang') as Language | null
      if (saved && ['id','en','ar'].includes(saved)) setLang(saved)
    } catch {}

    async function load() {
      if (id === 'mock-preview-order') { setOrder(MOCK_ORDER); setLoading(false); return }
      try {
        const res = await window.fetch(`/api/order/${id}`)
        if (res.ok) setOrder(await res.json())
      } catch {}
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    if (!order || loading) return
    const p = new URLSearchParams(window.location.search)
    if (p.get('download') === '1') setTimeout(() => triggerDownload(), 600)
  }, [order, loading])

  async function triggerDownload() {
    if (downloading) return
    setDown(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const el = document.getElementById('receipt-card')
      if (!el) return
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
      const link = document.createElement('a')
      link.download = `struk-${order?.order_number ?? id.slice(0, 8)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      setDone(true)
    } catch {}
    setDown(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }
  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <p className="text-gray-400">Pesanan tidak ditemukan.</p>
      </div>
    )
  }

  const L = LABELS[lang]
  const isRTL = lang === 'ar'
  const orderTypeLabel   = order.order_type === 'dine_in' ? L.dineIn : L.takeAway
  const paymentLabel     = order.payment_method === 'cash' ? L.cash
    : order.payment_method === 'qris' ? L.qris : L.online

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-start py-8 px-4"
      dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Download button */}
      <button onClick={triggerDownload} disabled={downloading}
        className="flex items-center gap-2 mb-6 px-6 py-3 rounded-full text-white font-semibold text-sm disabled:opacity-70"
        style={{ background: '#FF6B35', boxShadow: '0 4px 16px rgba(255,107,53,0.35)' }}>
        {downloading
          ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{L.downloading}</>
          : done
            ? <><CheckCircle size={16} />{L.done}</>
            : <><Download size={16} />{L.download}</>
        }
      </button>

      {/* Receipt card */}
      <div id="receipt-card" className="bg-white w-full max-w-[320px] overflow-hidden"
        style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.12)', borderRadius: 16 }}>

        {/* Header */}
        <div className="bg-gray-900 px-6 py-5 text-center">
          <div className="flex justify-center mb-2">
            <div className="relative w-[140px] h-[50px]">
              <Image src="/logo.png" alt="Serasa" fill className="object-contain" sizes="140px" />
            </div>
          </div>
          <p className="text-gray-400 text-[10px] tracking-widest uppercase">
            from indonesia for the world
          </p>
        </div>

        {/* Orange stripe */}
        <div className="px-6 py-2 text-center" style={{ background: '#FF6B35' }}>
          <p className="text-white text-[11px] font-black tracking-[3px] uppercase">{L.receipt}</p>
        </div>

        {/* Order info */}
        <div className="px-6 py-4 space-y-2" style={{ borderBottom: '1px dashed #E5E7EB' }}>
          {[
            { label: L.orderId,  value: order.order_number ?? order.id.slice(0, 8).toUpperCase() },
            { label: L.date,     value: formatDateTime(order.created_at, lang) },
            { label: L.table,    value: order.table_number },
            { label: L.name,     value: order.customer_name },
            { label: L.type,     value: orderTypeLabel },
            { label: L.payment,  value: paymentLabel },
          ].map(row => (
            <div key={row.label}
              className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-400 text-[11px] flex-shrink-0">{row.label}</span>
              <span className={`text-gray-900 text-[11px] font-semibold flex-1 ${isRTL ? 'text-left' : 'text-right'}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="px-6 py-4 space-y-2.5" style={{ borderBottom: '1px dashed #E5E7EB' }}>
          <p className="text-gray-400 text-[10px] tracking-widest uppercase mb-3">{L.order}</p>
          {order.order_items?.map(item => (
            <div key={item.id} className={`flex justify-between gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex-1">
                <p className="text-gray-900 text-[12px] font-medium">{item.name}</p>
                <p className="text-gray-400 text-[10px]">{item.qty} × {formatPrice(item.price)}</p>
              </div>
              <span className="text-gray-900 text-[12px] font-bold">{formatPrice(item.price * item.qty)}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="px-6 py-4" style={{ borderBottom: '1px dashed #E5E7EB' }}>
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600 font-semibold text-sm">{L.total}</span>
            <span className="font-black text-xl" style={{ color: '#FF6B35' }}>{formatPrice(order.total_price)}</span>
          </div>
          {(order.payment_method === 'online' || order.payment_method === 'qris') && (
            <div className={`flex items-center justify-between mt-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-300 text-[11px]">{L.status}</span>
              <span className="text-green-500 text-[11px] font-semibold">
                ✓ {paymentLabel} {L.paid}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 text-center space-y-1">
          <p className="text-gray-900 font-bold text-sm">{L.thanks}</p>
          <p className="text-gray-400 text-[10px]">{L.tagline}</p>
          <p className="text-gray-300 text-[9px] mt-3">Serasa Indonesian Restaurant · Saudi Arabia</p>
        </div>

        {/* Barcode decoration */}
        <div className="flex h-4">
          {[...Array(40)].map((_, i) => (
            <div key={i} className="flex-1"
              style={{ background: i % 3 === 0 ? '#1a1a1a' : i % 2 === 0 ? '#666' : '#f5f5f5' }} />
          ))}
        </div>
      </div>

      <p className="text-gray-400 text-xs mt-6 text-center">
        {L.download} — {lang === 'ar' ? 'مجلد التنزيلات' : lang === 'id' ? 'folder Downloads' : 'Downloads folder'}
      </p>
    </div>
  )
}
