'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle, Download } from 'lucide-react'
import { Order } from '@/types'
import { formatPrice } from '@/lib/utils'

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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ORDER_TYPE_LABEL: Record<string, string> = {
  dine_in: 'Dine In', take_away: 'Take Away',
}
const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Tunai', online: 'Transfer Bank', qris: 'QRIS',
}

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder]       = useState<Order | null>(null)
  const [loading, setLoading]   = useState(true)
  const [downloading, setDown]  = useState(false)
  const [done, setDone]         = useState(false)

  useEffect(() => {
    async function load() {
      if (id === 'mock-preview-order') {
        setOrder(MOCK_ORDER); setLoading(false); return
      }
      try {
        const res = await window.fetch(`/api/order/${id}`)
        if (res.ok) setOrder(await res.json())
      } catch {}
      setLoading(false)
    }
    load()
  }, [id])

  // Auto-download when ?download=1 is in URL
  useEffect(() => {
    if (!order || loading) return
    const p = new URLSearchParams(window.location.search)
    if (p.get('download') === '1') {
      setTimeout(() => triggerDownload(), 600)
    }
  }, [order, loading])

  async function triggerDownload() {
    if (downloading) return
    setDown(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const el = document.getElementById('receipt-card')
      if (!el) return
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `struk-${order?.order_number ?? id.slice(0, 8)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      setDone(true)
    } catch (e) {
      console.error(e)
    }
    setDown(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <p className="text-gray-400">Pesanan tidak ditemukan.</p>
      </div>
    )
  }

  const subtotal = order.order_items?.reduce((s, i) => s + i.price * i.qty, 0) ?? order.total_price

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-start py-8 px-4">

      {/* Download button */}
      <button
        onClick={triggerDownload}
        disabled={downloading}
        className="flex items-center gap-2 mb-6 px-6 py-3 rounded-2xl text-white font-semibold text-sm disabled:opacity-70 transition-opacity hover:opacity-90 active:scale-95"
        style={{ background: '#FF6B35', boxShadow: '0 4px 16px rgba(255,107,53,0.35)' }}
      >
        {downloading ? (
          <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Memproses...</>
        ) : done ? (
          <><CheckCircle size={16} /> Tersimpan!</>
        ) : (
          <><Download size={16} /> Download Struk</>
        )}
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
          <p className="text-white text-[11px] font-black tracking-[3px] uppercase">Struk Pembayaran</p>
        </div>

        {/* Order info */}
        <div className="px-6 py-4 space-y-2" style={{ borderBottom: '1px dashed #E5E7EB' }}>
          {[
            { label: 'No. Pesanan', value: order.order_number ?? order.id.slice(0, 8).toUpperCase() },
            { label: 'Tanggal',     value: formatDateTime(order.created_at) },
            { label: 'Meja',        value: order.table_number },
            { label: 'Nama',        value: order.customer_name },
            { label: 'Jenis',       value: ORDER_TYPE_LABEL[order.order_type ?? 'dine_in'] },
            { label: 'Pembayaran',  value: PAYMENT_LABEL[order.payment_method ?? 'cash'] },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-start gap-4">
              <span className="text-gray-400 text-[11px] flex-shrink-0">{row.label}</span>
              <span className="text-gray-900 text-[11px] font-semibold text-right">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="px-6 py-4 space-y-2.5" style={{ borderBottom: '1px dashed #E5E7EB' }}>
          <p className="text-gray-400 text-[10px] tracking-widest uppercase mb-3">Pesanan</p>
          {order.order_items?.map(item => (
            <div key={item.id} className="flex justify-between gap-2">
              <div className="flex-1">
                <p className="text-gray-900 text-[12px] font-medium">{item.name}</p>
                <p className="text-gray-400 text-[10px]">{item.qty} × {formatPrice(item.price)}</p>
              </div>
              <span className="text-gray-900 text-[12px] font-bold">
                {formatPrice(item.price * item.qty)}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="px-6 py-4" style={{ borderBottom: '1px dashed #E5E7EB' }}>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-semibold text-sm">TOTAL</span>
            <span className="font-black text-xl" style={{ color: '#FF6B35' }}>{formatPrice(order.total_price)}</span>
          </div>
          {(order.payment_method === 'online' || order.payment_method === 'qris') && (
            <div className="flex justify-between mt-1.5">
              <span className="text-gray-300 text-[11px]">Status</span>
              <span className="text-green-500 text-[11px] font-semibold">
                ✓ {PAYMENT_LABEL[order.payment_method]} Lunas
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 text-center space-y-1">
          <p className="text-gray-900 font-bold text-sm">Terima Kasih! 🙏</p>
          <p className="text-gray-400 text-[10px]">Semoga sehat selalu & selamat menikmati</p>
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
        Gambar struk tersimpan di folder <strong>Downloads</strong>
      </p>
    </div>
  )
}
