'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Printer, CheckCircle } from 'lucide-react'
import { Order } from '@/types'
import { supabase } from '@/lib/supabase'
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
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Pesanan tidak ditemukan.</p>
      </div>
    )
  }

  const subtotal = order.order_items?.reduce((s, i) => s + i.price * i.qty, 0) ?? order.total_price

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start py-8 px-4">

      {/* Print button — hidden on print */}
      <div className="no-print flex gap-3 mb-6">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm"
          style={{ background: '#FF6B35', boxShadow: '0 4px 16px rgba(255,107,53,0.35)' }}
        >
          <Printer size={16} /> Cetak Struk
        </button>
      </div>

      {/* Receipt card */}
      <div id="receipt" className="bg-white w-full max-w-[320px] shadow-xl rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gray-900 px-6 py-5 text-center">
          <div className="flex justify-center mb-3">
            <div className="relative w-[140px] h-[50px]">
              <Image src="/logo.png" alt="Serasa" fill className="object-contain" sizes="140px" />
            </div>
          </div>
          <p className="text-gray-400 text-[10px] tracking-widest uppercase mt-1">
            from indonesia for the world
          </p>
        </div>

        {/* Struk label */}
        <div className="bg-orange-500 px-6 py-2 text-center">
          <p className="text-white text-[11px] font-black tracking-[3px] uppercase">Struk Pembayaran</p>
        </div>

        {/* Order info */}
        <div className="px-6 py-4 space-y-2 border-b border-dashed border-gray-200">
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
        <div className="px-6 py-4 border-b border-dashed border-gray-200 space-y-2.5">
          <p className="text-gray-400 text-[10px] tracking-widest uppercase mb-3">Pesanan</p>
          {order.order_items?.map(item => (
            <div key={item.id} className="flex justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-[12px] font-medium leading-tight">{item.name}</p>
                <p className="text-gray-400 text-[10px]">{item.qty} × {formatPrice(item.price)}</p>
              </div>
              <span className="text-gray-900 text-[12px] font-bold flex-shrink-0">
                {formatPrice(item.price * item.qty)}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="px-6 py-4 border-b border-dashed border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm font-semibold">TOTAL</span>
            <span className="text-gray-900 font-black text-xl">{formatPrice(order.total_price)}</span>
          </div>
          {order.payment_method === 'cash' && (
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-gray-300 text-[11px]">Metode</span>
              <span className="text-gray-400 text-[11px]">Tunai</span>
            </div>
          )}
          {(order.payment_method === 'online' || order.payment_method === 'qris') && (
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-gray-300 text-[11px]">Metode</span>
              <span className="text-green-500 text-[11px] font-semibold flex items-center gap-1">
                <CheckCircle size={10} /> {PAYMENT_LABEL[order.payment_method]} Lunas
              </span>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="px-6 py-4 border-b border-dashed border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-[11px]">Status</span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{
                background: order.status === 'delivered' ? '#ECFDF5' : '#FFF3EE',
                color: order.status === 'delivered' ? '#10B981' : '#FF6B35',
              }}>
              {order.status === 'delivered' ? '✓ Selesai' : order.status === 'ready' ? 'Siap' : 'Diproses'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 text-center space-y-1">
          <p className="text-gray-900 font-bold text-sm">Terima Kasih! 🙏</p>
          <p className="text-gray-400 text-[10px]">Semoga sehat selalu & selamat menikmati</p>
          <p className="text-gray-300 text-[9px] mt-3">Serasa Indonesian Restaurant · Saudi Arabia</p>
        </div>

        {/* Barcode-style bottom decoration */}
        <div className="flex">
          {[...Array(40)].map((_, i) => (
            <div key={i} className="flex-1 h-4"
              style={{ background: i % 3 === 0 ? '#1a1a1a' : i % 2 === 0 ? '#555' : '#f5f5f5' }} />
          ))}
        </div>
      </div>

      <p className="no-print text-gray-400 text-xs mt-6 text-center">
        Tekan <strong>Cetak Struk</strong> atau gunakan <strong>Ctrl+P</strong>
      </p>

      <style>{`
        @media print {
          body { background: white !important; margin: 0; }
          .no-print { display: none !important; }
          #receipt {
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}
