'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Printer, Download, Shield } from 'lucide-react'
import { Component, ReactNode } from 'react'
import dynamic from 'next/dynamic'
import QRCode from 'qrcode'
import { QRCodeSVG } from 'qrcode.react'
import { usePOSStore } from '@/stores/pos.store'
import { formatPrice } from '@/lib/utils'
import { POSLine } from '@/types/pos'

const PDFDownloadButton = dynamic(
  () => import('@/components/PDFReceipt').then(m => ({ default: m.PDFDownloadButton })),
  { ssr: false, loading: () => (
    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm opacity-40 cursor-not-allowed"
      style={{ background: '#1A1208', color: 'white' }}>
      <Download size={14} /> PDF...
    </button>
  )}
)

class PDFErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return (
      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm opacity-40 cursor-not-allowed"
        style={{ background: '#1A1208', color: 'white' }}>
        <Download size={14} /> PDF N/A
      </button>
    )
    return this.props.children
  }
}

const RESTO_NAME    = process.env.NEXT_PUBLIC_RESTO_NAME    || 'SERASA RESTAURANT'
const RESTO_NAME_AR = process.env.NEXT_PUBLIC_RESTO_NAME_AR || 'مطعم سيراسا'
const BRANCH_NAME_AR= process.env.NEXT_PUBLIC_BRANCH_NAME_AR|| 'مكة المكرمة - السعودية'
const VAT_REG       = process.env.NEXT_PUBLIC_VAT_REG       || '310000000000003'
const CASHIER_NAME  = process.env.NEXT_PUBLIC_CASHIER_NAME  || 'MANAGER'

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: 'DINE IN',
  take_away: 'TAKE AWAY',
  delivery: 'DELIVERY',
}

interface Props {
  open: boolean
  onClose: () => void
  orderNumber?: string
  orderId?: string
}

function MetaRow({ arLabel, value, highlight }: { arLabel: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5">
      <span className="text-[12px] text-gray-900">{arLabel}</span>
      <span
        className="text-[12px] font-bold text-right"
        style={{ color: highlight ? '#EF4444' : '#1a1a1a' }}
      >
        {value}
      </span>
    </div>
  )
}

function ItemRow({ line }: { line: POSLine }) {
  const modSum = line.modifiers.reduce((s, m) => s + m.priceAdj, 0)
  const unitFinal = line.unitPrice + modSum
  const lineTotal = unitFinal * line.qty
  return (
    <div className="mb-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-gray-900 leading-tight">{line.name}</p>
          {line.name_ar && (
            <p className="text-[11px] text-gray-900 leading-tight">{line.name_ar}</p>
          )}
          {line.note && <p className="text-[11px] text-gray-900 italic">{line.note}</p>}
        </div>
        <span className="text-[13px] text-gray-900 flex-shrink-0 w-6 text-center">{line.qty}</span>
        <span className="text-[13px] font-bold text-gray-900 flex-shrink-0 min-w-[60px] text-right">
          {formatPrice(lineTotal)}
        </span>
      </div>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-dashed border-gray-300 my-2.5" />
}

export default function ReceiptModal({ open, onClose, orderNumber, orderId }: Props) {
  const lines = usePOSStore(s => s.lines)
  const orderType = usePOSStore(s => s.orderType)
  const tableNumber = usePOSStore(s => s.tableNumber)
  const customerName = usePOSStore(s => s.customerName)
  const payments = usePOSStore(s => s.payments)
  const discountType = usePOSStore(s => s.discountType)
  const discountValue = usePOSStore(s => s.discountValue)
  const taxPercent = usePOSStore(s => s.taxPercent)

  const getSubtotal = usePOSStore(s => s.getSubtotal)
  const getDiscountAmount = usePOSStore(s => s.getDiscountAmount)
  const getTaxAmount = usePOSStore(s => s.getTaxAmount)
  const getTotal = usePOSStore(s => s.getTotal)
  const getChange = usePOSStore(s => s.getChange)

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const taxAmount = getTaxAmount()
  const total = getTotal()
  const change = getChange()

  // ZATCA: VAT-inclusive breakdown
  const taxableAmount = total > 0 ? +(total / (1 + taxPercent / 100)).toFixed(2) : 0
  const vatAmount = +(total - taxableAmount).toFixed(2)

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-SA', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-SA', { hour: '2-digit', minute: '2-digit', hour12: false })
  const invoiceNo = orderNumber ? `INV-${orderNumber}` : `INV-${Date.now().toString().slice(-6)}`

  // QR data: basic TLV-like string for ZATCA
  const qrData = [
    RESTO_NAME,
    VAT_REG,
    `${dateStr} ${timeStr}`,
    `${total.toFixed(2)}`,
    `${vatAmount.toFixed(2)}`,
  ].join('|')

  const PAYMENT_LABELS: Record<string, string> = {
    cash: 'Cash / نقد',
    mada: 'Mada',
    visa: 'Visa/MC',
    qris: 'QRIS',
    transfer: 'Bank Transfer',
    online: 'Online',
  }

  async function handlePrint() {
    const itemsHtml = lines.map(l => {
      const modSum = l.modifiers.reduce((s, m) => s + m.priceAdj, 0)
      const unitFinal = l.unitPrice + modSum
      const lineTotal = unitFinal * l.qty
      const productCell = l.name_ar
        ? `${l.name} ${l.name_ar}`
        : l.name
      return `<tr>
        <td style="text-align:right;padding:3px 4px">${lineTotal.toFixed(2)}</td>
        <td style="text-align:right;padding:3px 4px">${unitFinal.toFixed(2)}</td>
        <td style="text-align:center;padding:3px 4px">${l.qty}</td>
        <td style="text-align:right;padding:3px 4px;direction:rtl">${productCell}</td>
      </tr>`
    }).join('')

    const tableDisplay = orderType === 'dine_in'
      ? (tableNumber || '1')
      : ORDER_TYPE_LABELS[orderType] || orderType

    const totalsHtml = `
      <tr>
        <td style="text-align:right;padding:3px 8px;font-weight:bold">${total.toFixed(2)} SR</td>
        <td style="text-align:right;direction:rtl;padding:3px 8px">TOTAL / الإجمالي</td>
      </tr>
      <tr>
        <td style="text-align:right;padding:3px 8px">${total.toFixed(2)} SR</td>
        <td style="text-align:right;direction:rtl;padding:3px 8px">To Pay / المطلوب</td>
      </tr>
      ${payments.map(p => `<tr>
        <td style="text-align:right;padding:3px 8px">${p.amount.toFixed(2)}</td>
        <td style="text-align:right;direction:rtl;padding:3px 8px">${PAYMENT_LABELS[p.method] ?? p.method}</td>
      </tr>`).join('')}
      ${change > 0 ? `<tr>
        <td style="text-align:right;padding:3px 8px;font-weight:bold">${change.toFixed(2)} SR</td>
        <td style="text-align:right;direction:rtl;padding:3px 8px;font-weight:bold">CHANGE / المتبقي</td>
      </tr>` : ''}
    `

    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 160, margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' },
    })

    const B = 'border:1px solid #000'
    const html = `
      <html><head><title>${invoiceNo}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Courier New',monospace;font-size:12px;width:80mm;padding:4mm 3mm;color:#000}
        .c{text-align:center} .b{font-weight:bold}
        .box{${B};padding:3px 6px;margin:2px 0;text-align:center}
        .row{display:flex;justify-content:space-between;align-items:center;${B};padding:3px 6px;margin:2px 0}
        table{width:100%;border-collapse:collapse;margin:3px 0}
        th,td{${B};font-size:11px}
        @page{size:80mm auto;margin:4mm}
      </style></head>
      <body>
        <div class="c" style="margin-bottom:4px">
          <img src="/logof22.png" style="max-height:44px;max-width:110px;object-fit:contain;display:block;margin:0 auto 3px"/>
          <div style="font-size:16px;font-weight:900;letter-spacing:2px">serasa</div>
          <div style="font-size:10px;letter-spacing:5px">RESTAURANT</div>
        </div>

        <div class="box">
          <div style="font-size:11px;direction:rtl">فاتورة ضريبية مبسطة</div>
          <div class="b" style="font-size:14px">SIMPLIFIED TAX INVOICE</div>
        </div>

        <div class="box">
          <div style="font-size:10px">Invoice No / رقم الفاتورة</div>
          <div class="b">Order ${invoiceNo.replace('INV-', '')}</div>
        </div>

        <div class="box">
          <div style="font-size:10px">Table No / رقم الطاولة</div>
          <div class="b">${tableDisplay}</div>
        </div>

        <div class="box" style="font-size:14px;font-weight:bold;direction:rtl">${RESTO_NAME_AR}</div>

        <div class="row">
          <span>VAT No:${VAT_REG}</span>
          <span style="direction:rtl">:الرقم الضريبي</span>
        </div>
        <div class="row">
          <span>Date: ${dateStr} ${timeStr}</span>
          <span style="direction:rtl">:التاريخ</span>
        </div>
        <div class="box" style="direction:rtl;font-size:11px">${BRANCH_NAME_AR}</div>

        <table>
          <thead><tr>
            <th style="text-align:right;width:22%;padding:3px 4px">Sub Total<br>الإجمالي الفرعي</th>
            <th style="text-align:right;width:18%;padding:3px 4px">Price<br>سعر</th>
            <th style="text-align:center;width:12%;padding:3px 4px">Qty<br>الكمية</th>
            <th style="text-align:right;width:48%;padding:3px 4px;direction:rtl">Product<br>الصنف</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <table style="margin-top:3px">
          <tbody>${totalsHtml}</tbody>
        </table>

        <div class="box c" style="margin-top:4px;padding:6px">
          <img src="${qrDataUrl}" width="120" height="120" style="display:block;margin:0 auto"/>
        </div>

        <div class="c" style="margin-top:4px;font-size:11px">
          Served by: ${CASHIER_NAME} :بواسطة
        </div>
      </body></html>
    `
    const win = window.open('', '_blank', 'width=420,height=800')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 600)
  }

  const pdfData = {
    orderNumber,
    tableNumber,
    customerName: customerName || 'Guest',
    orderType,
    createdAt: new Date().toISOString(),
    items: lines.map(l => ({
      id: l.lineId, name: l.name, name_ar: l.name_ar, price: l.unitPrice, qty: l.qty, notes: l.note,
    })),
    subtotal, discountType, discountValue, discountAmount,
    taxPercent, taxAmount, total, payments,
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden z-10 flex flex-col"
            style={{ maxHeight: '92dvh', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
              style={{ background: '#1A1208' }}>
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-green-400" />
                <div>
                  <p className="text-white font-black text-xs leading-none">ZATCA E-Invoice Simplified Tax Invoice</p>
                  <p className="text-gray-400 text-[9px] mt-0.5">FATOORA SAUDI COMPLIANT GATEWAY</p>
                </div>
              </div>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10">
                <X size={13} className="text-white" />
              </button>
            </div>

            {/* Receipt body */}
            <div className="flex-1 overflow-y-auto">
              <div
                className="mx-4 my-4 rounded-2xl overflow-hidden"
                style={{
                  fontFamily: '"Courier New", monospace',
                  background: 'white',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)',
                }}
              >
                {/* Tear top */}
                <div style={{
                  height: '10px',
                  background: 'repeating-linear-gradient(90deg,#f3f4f6 0,#f3f4f6 10px,white 10px,white 20px)',
                }} />

                <div className="px-5 py-4">
                  {/* Resto name */}
                  <div className="text-center mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logof22.png" alt="Logo" style={{ height: 48, maxWidth: 140, objectFit: 'contain', margin: '0 auto 6px' }} />
                    <p className="font-black text-base leading-tight" style={{ color: '#CC0000' }}>
                      {RESTO_NAME}
                    </p>
                    <p className="text-[12px] text-gray-900 mt-0.5">{BRANCH_NAME_AR}</p>
                    <p className="text-[11px] text-gray-900 mt-0.5">{invoiceNo}</p>
                  </div>

                  <Divider />

                  {/* Meta rows — Arabic label left, value right */}
                  <div className="space-y-0.5 mb-1">
                    <MetaRow arLabel="الرقم الضريبي (VAT Reg):" value={VAT_REG} />
                    <MetaRow arLabel="التاريخ (Date):" value={`${dateStr}, ${timeStr}`} />
                    <MetaRow arLabel="العميل (Customer):" value={customerName || 'Guest'} />
                    <MetaRow arLabel="نوع الطلب (Order Type):" value={ORDER_TYPE_LABELS[orderType] || orderType} />
                    <MetaRow arLabel="رقم الطاولة (Table No):" value={tableNumber || '—'} highlight />
                  </div>

                  <Divider />

                  {/* Items table header */}
                  <div className="flex items-center gap-2 pb-1.5" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <span className="flex-1 text-[11px] text-gray-900 font-bold">Item الوصف</span>
                    <span className="text-[11px] text-gray-900 w-6 text-center">Qty</span>
                    <span className="text-[11px] text-gray-900 min-w-[60px] text-right">Total SAR</span>
                  </div>

                  {/* Items */}
                  <div className="mt-2">
                    {lines.map(line => (
                      <ItemRow key={line.lineId} line={line} />
                    ))}
                  </div>

                  <Divider />

                  {/* Totals */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-gray-900">Subtotal (الفرعي):</span>
                      <span className="font-semibold">{formatPrice(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-gray-900">Discount {discountType === 'percent' ? `${discountValue}%` : ''}:</span>
                        <span className="font-bold">-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                  </div>

                  <Divider />

                  {/* Grand Total */}
                  <div className="flex justify-between items-baseline">
                    <span className="font-black text-sm">Total Amount (الإجمالي):</span>
                    <span className="font-black text-xl text-gray-900">{formatPrice(total)}</span>
                  </div>

                  {/* Payments */}
                  {payments.length > 0 && (
                    <>
                      <Divider />
                      <div className="space-y-1">
                        {payments.map((p, i) => (
                          <div key={i} className="flex justify-between text-[12px]">
                            <span className="text-gray-900">{PAYMENT_LABELS[p.method] ?? p.method}</span>
                            <span className="font-bold">{formatPrice(p.amount)}</span>
                          </div>
                        ))}
                        {change > 0 && (
                          <div className="flex justify-between text-[13px] font-black text-gray-900 mt-1">
                            <span>Change / الباقي:</span>
                            <span>{formatPrice(change)}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <Divider />

                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="p-2 border border-gray-900 rounded-sm inline-block">
                      <QRCodeSVG value={qrData} size={110} level="M" />
                    </div>
                  </div>

                  {/* Served by */}
                  <p className="text-[11px] text-gray-900 text-center mt-3">
                    Served by: {CASHIER_NAME} :بواسطة
                  </p>
                </div>

                {/* Tear bottom */}
                <div style={{
                  height: '10px',
                  background: 'repeating-linear-gradient(90deg,#f3f4f6 0,#f3f4f6 10px,white 10px,white 20px)',
                  marginTop: '8px',
                }} />
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 pb-5 pt-3 flex-shrink-0 border-t border-gray-100 flex gap-2">
              <PDFErrorBoundary>
                <PDFDownloadButton data={pdfData} orderNumber={orderNumber} />
              </PDFErrorBoundary>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handlePrint}
                className="flex-1 py-3 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2"
                style={{ background: '#1A1208' }}
              >
                <Printer size={16} />
                Print Receipt
              </motion.button>
              <button
                onClick={onClose}
                className="py-3 px-4 rounded-2xl font-black text-white text-sm"
                style={{ background: '#EF4444' }}
              >
                New Order
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
