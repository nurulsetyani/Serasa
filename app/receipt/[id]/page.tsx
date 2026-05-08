'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Printer } from 'lucide-react'
import { Order, MenuItem, Language } from '@/types'
import { formatPrice } from '@/lib/utils'

const MOCK_ORDER: Order = {
  id: 'mock-preview-order',
  restaurant_id: '550e8400-e29b-41d4-a716-446655440000',
  order_number: 'ORD-DEMO1', table_number: '3', customer_name: 'Ahmad',
  order_type: 'dine_in', payment_method: 'cash', status: 'delivered',
  total_price: 62, created_at: new Date().toISOString(),
  order_items: [
    { id: 'oi-1', order_id: 'mock-preview-order', menu_id: 'm1', name: 'Mie Goreng Ayam', price: 25, qty: 2 },
    { id: 'oi-2', order_id: 'mock-preview-order', menu_id: 'm9', name: 'Es Cendol', price: 12, qty: 1 },
  ],
}

// ── Labels per language ────────────────────────────────────
const L: Record<Language, Record<string, string>> = {
  id: {
    receipt: 'STRUK PEMBAYARAN', orderId: 'No. Pesanan', date: 'Tanggal',
    table: 'Meja', name: 'Nama', type: 'Jenis', payment: 'Pembayaran',
    order: 'Pesanan', total: 'TOTAL', status: 'Status',
    thanks: 'Terima Kasih! 🙏', tagline: 'Semoga sehat selalu & selamat menikmati',
    dineIn: 'Dine In', takeAway: 'Bawa Pulang',
    cash: 'Tunai', online: 'Transfer Bank', qris: 'QRIS',
    paid: 'Lunas', print: 'Cetak Struk',
  },
  en: {
    receipt: 'PAYMENT RECEIPT', orderId: 'Order No.', date: 'Date',
    table: 'Table', name: 'Name', type: 'Type', payment: 'Payment',
    order: 'Order', total: 'TOTAL', status: 'Status',
    thanks: 'Thank You! 🙏', tagline: 'Enjoy your meal — we hope you feel great!',
    dineIn: 'Dine In', takeAway: 'Take Away',
    cash: 'Cash', online: 'Bank Transfer', qris: 'QRIS',
    paid: 'Paid', print: 'Print Receipt',
  },
  ar: {
    receipt: 'إيصال الدفع', orderId: 'رقم الطلب', date: 'التاريخ',
    table: 'الطاولة', name: 'الاسم', type: 'النوع', payment: 'الدفع',
    order: 'الطلب', total: 'الإجمالي', status: 'الحالة',
    thanks: 'شكراً لك! 🙏', tagline: 'بالهناء والشفاء — وجبة شهية!',
    dineIn: 'تناول في المطعم', takeAway: 'سفري',
    cash: 'نقداً', online: 'تحويل بنكي', qris: 'QRIS',
    paid: 'مدفوع', print: 'طباعة الإيصال',
  },
}

function getItemName(item: MenuItem, lang: Language): string {
  if (lang === 'ar') return item.name_ar || item.name_en
  if (lang === 'id') return item.name_id || item.name_en
  return item.name_en
}

function formatDateTime(iso: string, lang: Language) {
  const locale = lang === 'ar' ? 'ar-SA' : lang === 'id' ? 'id-ID' : 'en-US'
  return new Date(iso).toLocaleString(locale, {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder]     = useState<Order | null>(null)
  const [menuMap, setMenuMap] = useState<Record<string, MenuItem>>({})
  const [loading, setLoading] = useState(true)
  const [lang, setLang]       = useState<Language>('id')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('serasa_lang') as Language | null
      if (saved && ['id','en','ar'].includes(saved)) setLang(saved)
    } catch {}

    async function load() {
      // Load order
      let orderData: Order
      if (id === 'mock-preview-order') {
        orderData = MOCK_ORDER
      } else {
        const res = await window.fetch(`/api/order/${id}`)
        if (res.ok) orderData = await res.json()
        else { setLoading(false); return }
      }
      setOrder(orderData)

      // Load menu items for translated names
      try {
        const mRes = await window.fetch('/api/menu')
        if (mRes.ok) {
          const items: MenuItem[] = await mRes.json()
          const map: Record<string, MenuItem> = {}
          items.forEach(m => { map[m.id] = m })
          setMenuMap(map)
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [id])

  // Auto-print when ?print=1
  useEffect(() => {
    if (!order || loading) return
    const p = new URLSearchParams(window.location.search)
    if (p.get('print') === '1') setTimeout(() => window.print(), 700)
  }, [order, loading])

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  )

  if (!order) return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <p className="text-gray-400">Pesanan tidak ditemukan.</p>
    </div>
  )

  const lbl = L[lang]
  const isRTL = lang === 'ar'
  const orderTypeLabel = order.order_type === 'dine_in' ? lbl.dineIn : lbl.takeAway
  const paymentLabel   = order.payment_method === 'cash' ? lbl.cash
    : order.payment_method === 'qris' ? lbl.qris : lbl.online

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4"
      dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Print button — hidden on print */}
      <button onClick={() => window.print()}
        className="no-print flex items-center gap-2 mb-6 px-6 py-3 rounded-full text-white font-semibold text-sm"
        style={{ background: '#FF6B35', boxShadow: '0 4px 16px rgba(255,107,53,0.35)' }}>
        <Printer size={16} /> {lbl.print}
      </button>

      {/* Receipt */}
      <div id="receipt" className="bg-white w-full max-w-[320px] overflow-hidden"
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

        {/* Orange label */}
        <div className="px-6 py-2 text-center" style={{ background: '#FF6B35' }}>
          <p className="text-white text-[11px] font-black tracking-[3px] uppercase">{lbl.receipt}</p>
        </div>

        {/* Order info */}
        <div className="px-6 py-4 space-y-2" style={{ borderBottom: '1px dashed #E5E7EB' }}>
          {[
            { label: lbl.orderId,  value: order.order_number ?? order.id.slice(0,8).toUpperCase() },
            { label: lbl.date,     value: formatDateTime(order.created_at, lang) },
            { label: lbl.table,    value: order.table_number },
            { label: lbl.name,     value: order.customer_name },
            { label: lbl.type,     value: orderTypeLabel },
            { label: lbl.payment,  value: paymentLabel },
          ].map(row => (
            <div key={row.label} className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-400 text-[11px] flex-shrink-0">{row.label}</span>
              <span className={`text-gray-900 text-[11px] font-semibold flex-1 ${isRTL ? 'text-left' : 'text-right'}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Items — with translated names */}
        <div className="px-6 py-4 space-y-2.5" style={{ borderBottom: '1px dashed #E5E7EB' }}>
          <p className="text-gray-400 text-[10px] tracking-widest uppercase mb-3">{lbl.order}</p>
          {order.order_items?.map(item => {
            const menuItem = menuMap[item.menu_id]
            const displayName = menuItem ? getItemName(menuItem, lang) : item.name
            return (
              <div key={item.id} className={`flex justify-between gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex-1">
                  <p className="text-gray-900 text-[12px] font-medium"
                    style={{ fontFamily: lang === 'ar' ? 'var(--font-noto-arabic),serif' : undefined }}>
                    {displayName}
                  </p>
                  <p className="text-gray-400 text-[10px]">{item.qty} × {formatPrice(item.price)}</p>
                </div>
                <span className="text-gray-900 text-[12px] font-bold">{formatPrice(item.price * item.qty)}</span>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div className="px-6 py-4" style={{ borderBottom: '1px dashed #E5E7EB' }}>
          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600 font-semibold text-sm">{lbl.total}</span>
            <span className="font-black text-xl" style={{ color: '#FF6B35' }}>{formatPrice(order.total_price)}</span>
          </div>
          {(order.payment_method === 'online' || order.payment_method === 'qris') && (
            <div className={`flex items-center justify-between mt-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-300 text-[11px]">{lbl.status}</span>
              <span className="text-green-500 text-[11px] font-semibold">✓ {paymentLabel} {lbl.paid}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 text-center space-y-1">
          <p className="text-gray-900 font-bold text-sm"
            style={{ fontFamily: lang === 'ar' ? 'var(--font-noto-arabic),serif' : undefined }}>
            {lbl.thanks}
          </p>
          <p className="text-gray-400 text-[10px]"
            style={{ fontFamily: lang === 'ar' ? 'var(--font-noto-arabic),serif' : undefined }}>
            {lbl.tagline}
          </p>
          <p className="text-gray-300 text-[9px] mt-3">Serasa Indonesian Restaurant · Saudi Arabia</p>
        </div>

        {/* Barcode */}
        <div className="flex h-4">
          {[...Array(40)].map((_, i) => (
            <div key={i} className="flex-1"
              style={{ background: i % 3 === 0 ? '#1a1a1a' : i % 2 === 0 ? '#666' : '#f5f5f5' }} />
          ))}
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; margin: 0; }
          .no-print { display: none !important; }
          #receipt {
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
          }
          @page { size: 80mm auto; margin: 4mm; }
        }
      `}</style>
    </div>
  )
}
