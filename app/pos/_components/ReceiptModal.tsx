'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Printer, Download, CheckCircle2 } from 'lucide-react'
import { usePOSStore } from '@/stores/pos.store'
import { formatPrice } from '@/lib/utils'
import { POSLine } from '@/types/pos'

const P = '#FF6B35'
const RESTO_NAME = 'SERASA RESTAURANT'
const RESTO_SUB = 'Authentic Indonesian Cuisine'
const RESTO_ADDR = 'Al Khobar, Saudi Arabia'

interface Props {
  open: boolean
  onClose: () => void
  orderNumber?: string
}

function ReceiptLine({ line, lang }: { line: POSLine; lang: string }) {
  const modSum = line.modifiers.reduce((s, m) => s + m.priceAdj, 0)
  const unitFinal = line.unitPrice + modSum

  return (
    <div className="mb-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-xs">{line.name}</p>
          {line.modifiers.map(m => (
            <p key={m.id} className="text-[10px] text-gray-500 pl-2">
              + {m.name} {m.priceAdj > 0 ? `(+${formatPrice(m.priceAdj)})` : ''}
            </p>
          ))}
          {line.note && <p className="text-[10px] text-gray-400 italic pl-2">{line.note}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-gray-500">{line.qty}× {formatPrice(unitFinal)}</p>
          <p className="font-black text-xs text-gray-900">{formatPrice(line.lineTotal)}</p>
        </div>
      </div>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-dashed border-gray-300 my-3" />
}

export default function ReceiptModal({ open, onClose, orderNumber }: Props) {
  const lines = usePOSStore(s => s.lines)
  const lang = usePOSStore(s => s.lang)
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
  const getAmountPaid = usePOSStore(s => s.getAmountPaid)

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const taxAmount = getTaxAmount()
  const total = getTotal()
  const change = getChange()
  const amountPaid = getAmountPaid()

  const now = new Date()
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  const PAYMENT_LABELS: Record<string, string> = {
    cash: 'Tunai', mada: 'Mada', visa: 'Visa/MC',
    qris: 'QRIS', transfer: 'Transfer Bank',
  }

  const ORDER_TYPE_LABELS: Record<string, string> = {
    dine_in: 'Dine In', take_away: 'Take Away', delivery: 'Delivery',
  }

  function handlePrint() {
    const style = `
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Courier New',monospace; font-size:11px; width:80mm; padding:6mm 4mm; }
        .center { text-align:center; }
        .bold { font-weight:bold; }
        .right { text-align:right; }
        .divider { border-top:1px dashed #000; margin:6px 0; }
        .row { display:flex; justify-content:space-between; margin:2px 0; }
        .small { font-size:9px; }
        .large { font-size:14px; }
        .xl { font-size:17px; font-weight:900; }
        h1 { font-size:16px; font-weight:900; text-align:center; letter-spacing:2px; }
        .sub { font-size:10px; text-align:center; margin-top:2px; }
        .mod { font-size:9px; padding-left:8px; color:#555; }
        .total-row { font-size:14px; font-weight:900; }
      </style>
    `
    const itemsHtml = lines.map(l => {
      const modSum = l.modifiers.reduce((s, m) => s + m.priceAdj, 0)
      const unitFinal = l.unitPrice + modSum
      const modsHtml = l.modifiers.map(m =>
        `<div class="mod">+ ${m.name}${m.priceAdj > 0 ? ` (+${formatPrice(m.priceAdj)})` : ''}</div>`
      ).join('')
      const noteHtml = l.note ? `<div class="mod" style="font-style:italic">${l.note}</div>` : ''
      return `
        <div style="margin-bottom:6px">
          <div class="row">
            <span class="bold">${l.name}</span>
            <span>${formatPrice(l.lineTotal)}</span>
          </div>
          <div style="text-align:right;font-size:9px;color:#555">${l.qty}× ${formatPrice(unitFinal)}</div>
          ${modsHtml}${noteHtml}
        </div>
      `
    }).join('')

    const discountRow = discountAmount > 0
      ? `<div class="row" style="color:#16a34a"><span>Diskon (${discountType === 'percent' ? `${discountValue}%` : 'Nominal'})</span><span>-${formatPrice(discountAmount)}</span></div>`
      : ''

    const paymentsHtml = payments.map(p =>
      `<div class="row"><span>${PAYMENT_LABELS[p.method] ?? p.method}</span><span>${formatPrice(p.amount)}</span></div>`
    ).join('')

    const html = `
      <html><head><title>Struk ${orderNumber ?? ''}</title>${style}</head>
      <body>
        <h1>${RESTO_NAME}</h1>
        <div class="sub">${RESTO_SUB}</div>
        <div class="sub">${RESTO_ADDR}</div>
        <div class="divider"></div>
        <div class="row"><span>${dateStr}</span><span>${timeStr}</span></div>
        ${orderNumber ? `<div class="row"><span>No. Order</span><span>${orderNumber}</span></div>` : ''}
        <div class="row"><span>Meja</span><span>#${tableNumber || '–'}</span></div>
        <div class="row"><span>Pelanggan</span><span>${customerName || 'Guest'}</span></div>
        <div class="row"><span>Jenis</span><span>${ORDER_TYPE_LABELS[orderType]}</span></div>
        <div class="divider"></div>
        ${itemsHtml}
        <div class="divider"></div>
        <div class="row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
        ${discountRow}
        <div class="row"><span>VAT ${taxPercent}%</span><span>${formatPrice(taxAmount)}</span></div>
        <div class="divider"></div>
        <div class="row total-row"><span>TOTAL</span><span>${formatPrice(total)}</span></div>
        <div class="divider"></div>
        ${paymentsHtml}
        ${change > 0 ? `<div class="row bold" style="font-size:13px"><span>Kembalian</span><span>${formatPrice(change)}</span></div>` : ''}
        <div class="divider"></div>
        <div class="center small" style="margin-top:8px">Terima kasih telah berkunjung</div>
        <div class="center small">Thank you for dining with us</div>
        <div class="center small">شكراً لزيارتكم</div>
        <div class="center small" style="margin-top:6px; font-size:9px">**** Struk ini adalah bukti pembayaran ****</div>
      </body></html>
    `
    const win = window.open('', '_blank', 'width=400,height=680')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
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
            className="relative w-full max-w-xs bg-white rounded-3xl overflow-hidden z-10 flex flex-col"
            style={{ maxHeight: '90dvh', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-500" />
                <h3 className="font-black text-gray-900 text-sm">Preview Struk</h3>
              </div>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">
                <X size={13} className="text-gray-500" />
              </button>
            </div>

            {/* Receipt preview — thermal style */}
            <div className="flex-1 overflow-y-auto">
              <div
                className="mx-4 my-4 rounded-2xl overflow-hidden"
                style={{
                  fontFamily: '"Courier New", monospace',
                  background: 'white',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
                }}
              >
                {/* Thermal top tear */}
                <div style={{
                  height: '12px',
                  background: 'repeating-linear-gradient(90deg, #f3f4f6 0, #f3f4f6 12px, white 12px, white 24px)',
                  marginBottom: '-1px',
                }} />

                <div className="px-5 py-4">
                  {/* Resto info */}
                  <div className="text-center mb-3">
                    <p className="font-black text-sm tracking-widest">{RESTO_NAME}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{RESTO_SUB}</p>
                    <p className="text-[10px] text-gray-400">{RESTO_ADDR}</p>
                  </div>

                  <Divider />

                  {/* Meta */}
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">{dateStr}</span>
                      <span className="text-gray-500">{timeStr}</span>
                    </div>
                    {orderNumber && (
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-500">No. Order</span>
                        <span className="font-black text-gray-900">{orderNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">Meja</span>
                      <span className="font-bold text-gray-900">#{tableNumber || '–'}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">Jenis</span>
                      <span className="font-bold text-gray-900">{ORDER_TYPE_LABELS[orderType]}</span>
                    </div>
                  </div>

                  <Divider />

                  {/* Items */}
                  {lines.map(line => (
                    <ReceiptLine key={line.lineId} line={line} lang={lang} />
                  ))}

                  <Divider />

                  {/* Totals */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-semibold">{formatPrice(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-[10px] text-green-600">
                        <span>Diskon {discountType === 'percent' ? `${discountValue}%` : ''}</span>
                        <span className="font-bold">-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">VAT {taxPercent}%</span>
                      <span className="font-semibold">{formatPrice(taxAmount)}</span>
                    </div>
                  </div>

                  <Divider />

                  {/* Grand total */}
                  <div className="flex justify-between items-baseline">
                    <span className="font-black text-sm">TOTAL</span>
                    <span className="font-black text-xl" style={{ color: P }}>{formatPrice(total)}</span>
                  </div>

                  <Divider />

                  {/* Payments */}
                  <div className="space-y-1">
                    {payments.map((p, i) => (
                      <div key={i} className="flex justify-between text-[10px]">
                        <span className="text-gray-600">{PAYMENT_LABELS[p.method] ?? p.method}</span>
                        <span className="font-bold">{formatPrice(p.amount)}</span>
                      </div>
                    ))}
                    {change > 0 && (
                      <div className="flex justify-between text-[11px] font-black text-green-700 mt-1">
                        <span>Kembalian</span>
                        <span>{formatPrice(change)}</span>
                      </div>
                    )}
                  </div>

                  <Divider />

                  {/* Footer */}
                  <div className="text-center space-y-0.5 pb-1">
                    <p className="text-[9px] text-gray-400">Terima kasih telah berkunjung</p>
                    <p className="text-[9px] text-gray-400">Thank you for dining with us</p>
                    <p className="text-[9px] text-gray-400">شكراً لزيارتكم</p>
                  </div>
                </div>

                {/* Bottom tear */}
                <div style={{
                  height: '12px',
                  background: 'repeating-linear-gradient(90deg, #f3f4f6 0, #f3f4f6 12px, white 12px, white 24px)',
                  marginTop: '-1px',
                }} />
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 pb-5 pt-3 flex gap-2 flex-shrink-0 border-t border-gray-100">
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-2xl font-bold text-gray-600 bg-[#F5F2EE] text-sm"
              >
                <X size={14} />
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handlePrint}
                className="flex-1 py-3 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2"
                style={{ background: P, boxShadow: `0 6px 20px rgba(255,107,53,0.35)` }}
              >
                <Printer size={16} />
                Print Struk
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: 'Dine In', take_away: 'Take Away', delivery: 'Delivery',
}
