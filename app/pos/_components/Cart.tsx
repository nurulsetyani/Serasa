'use client'
import { AnimatePresence } from 'framer-motion'
import { ShoppingCart, Trash2, Scissors, Receipt, Phone, MapPin, CreditCard, QrCode, Unlink } from 'lucide-react'
import { useState } from 'react'
import { usePOSStore } from '@/stores/pos.store'
import { formatPrice } from '@/lib/utils'
import CartLine from './CartLine'
import PaymentModal from './PaymentModal'
import SplitBillModal from './SplitBillModal'
import ReceiptModal from './ReceiptModal'

const P = '#FF6B35'

interface Props {
  tableParam?: string
}

const QUICK_DISCOUNTS = [5, 10, 15, 20]

export default function Cart({ tableParam }: Props) {
  const lines = usePOSStore(s => s.lines)
  const orderType = usePOSStore(s => s.orderType)
  const tableNumber = usePOSStore(s => s.tableNumber)
  const customerName = usePOSStore(s => s.customerName)
  const customerPhone = usePOSStore(s => s.customerPhone)
  const deliveryAddress = usePOSStore(s => s.deliveryAddress)
  const setTable = usePOSStore(s => s.setTable)
  const setCustomer = usePOSStore(s => s.setCustomer)
  const setDeliveryAddress = usePOSStore(s => s.setDeliveryAddress)
  const discountType = usePOSStore(s => s.discountType)
  const discountValue = usePOSStore(s => s.discountValue)
  const setDiscount = usePOSStore(s => s.setDiscount)
  const clearDiscount = usePOSStore(s => s.clearDiscount)
  const taxPercent = usePOSStore(s => s.taxPercent)
  const clearCart = usePOSStore(s => s.clearCart)
  const newOrder = usePOSStore(s => s.newOrder)
  const clearPayments = usePOSStore(s => s.clearPayments)
  const sourceQrOrderId = usePOSStore(s => s.sourceQrOrderId)
  const setSourceQrOrderId = usePOSStore(s => s.setSourceQrOrderId)

  const getSubtotal = usePOSStore(s => s.getSubtotal)
  const getDiscountAmount = usePOSStore(s => s.getDiscountAmount)
  const getTaxAmount = usePOSStore(s => s.getTaxAmount)
  const getTotal = usePOSStore(s => s.getTotal)

  const [showPayment, setShowPayment] = useState(false)
  const [showSplit, setShowSplit] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastOrderNumber, setLastOrderNumber] = useState<string | undefined>()
  const [lastOrderId, setLastOrderId] = useState<string | undefined>()
  const [discountCode, setDiscountCode] = useState('')

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const taxAmount = getTaxAmount()
  const total = getTotal()
  const isEmpty = lines.length === 0
  const totalQty = lines.reduce((s, l) => s + l.qty, 0)


  function handleApplyCode() {
    // Simple code logic: codes like "10OFF" → 10%, "SAVE20" → 20%
    const match = discountCode.toUpperCase().match(/(\d+)/)
    if (match) {
      const pct = parseInt(match[1])
      if (pct > 0 && pct <= 100) {
        setDiscount('percent', pct)
        setDiscountCode('')
        return
      }
    }
    // Unknown code — no-op (could show error)
  }

  async function handleConfirmOrder() {
    if (loading || isEmpty) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/pos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'pos',
          customer_name: customerName || 'Guest',
          customer_phone: customerPhone || null,
          table_number: tableNumber || tableParam || '1',
          order_type: orderType,
          delivery_address: orderType === 'delivery' ? deliveryAddress : null,
          subtotal,
          discount_type: discountType,
          discount_value: discountValue,
          discount_amount: discountAmount,
          tax_percent: taxPercent,
          tax_amount: taxAmount,
          total_price: total,
          items: lines.map(l => ({
            menu_id: l.menuId,
            name: l.name,
            price: l.unitPrice,
            qty: l.qty,
            notes: l.note || null,
            modifiers: l.modifiers,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create order')
      setLastOrderNumber(data.order_number)
      setLastOrderId(data.id)
      if (sourceQrOrderId) {
        fetch(`/api/order/${sourceQrOrderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'delivered' }),
        }).catch(() => {})
      }
      fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'kitchen',
          order: {
            id: data.id,
            order_number: data.order_number,
            table_number: tableNumber || tableParam || '1',
            customer_name: customerName || 'Guest',
            order_type: orderType,
            created_at: new Date().toISOString(),
            order_items: lines.map(l => ({
              id: l.lineId, name: l.name, price: l.unitPrice,
              qty: l.qty, notes: l.note || null,
            })),
          },
        }),
      }).catch(() => {})
      setShowPayment(false)
      setShowReceipt(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  function handleReceiptClose() {
    setShowReceipt(false)
    newOrder()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cart Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} style={{ color: P }} />
            <span className="font-black text-gray-900 text-sm">
              Cart / السلة
              {totalQty > 0 && (
                <span
                  className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full text-white font-black"
                  style={{ background: P }}
                >
                  {totalQty}
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isEmpty && (
              <button
                onClick={() => setShowReceipt(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Receipt size={11} />
                Receipt
              </button>
            )}
            {!isEmpty && (
              <button onClick={clearCart} className="text-red-400 hover:text-red-600 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Table & Customer */}
        <div className="grid grid-cols-2 gap-2">
          {orderType !== 'delivery' ? (
            <div className="bg-[#F5F2EE] rounded-xl px-3 py-2">
              <p className="text-[9px] font-black tracking-widest uppercase text-gray-400 mb-1">Table No.</p>
              <input
                type="text"
                value={tableNumber}
                onChange={e => setTable(e.target.value)}
                placeholder={tableParam ?? '–'}
                className="w-full text-sm font-black text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
              />
            </div>
          ) : (
            <div className="bg-[#F5F2EE] rounded-xl px-3 py-2 flex items-center gap-1.5">
              <Phone size={11} className="text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-black tracking-widest uppercase text-gray-400 mb-1">Phone / هاتف</p>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomer(customerName, e.target.value)}
                  placeholder="05XX-XXX-XXXX"
                  className="w-full text-sm font-black text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          )}
          <div className="bg-[#F5F2EE] rounded-xl px-3 py-2">
            <p className="text-[9px] font-black tracking-widest uppercase text-gray-400 mb-1">Name / اسم</p>
            <input
              type="text"
              value={customerName === 'Guest' ? '' : customerName}
              onChange={e => setCustomer(e.target.value, customerPhone)}
              placeholder="Guest"
              className="w-full text-sm font-black text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        {orderType === 'delivery' && (
          <div className="bg-[#FFF8EE] rounded-xl px-3 py-2 mt-2 flex gap-2 items-start"
            style={{ border: '1.5px solid #FDE0A8' }}>
            <MapPin size={12} className="text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[9px] font-black tracking-widest uppercase text-orange-400 mb-1">Delivery Address / عنوان التوصيل</p>
              <textarea
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
                placeholder="Enter full address..."
                rows={2}
                className="w-full text-xs font-semibold text-gray-900 bg-transparent outline-none resize-none placeholder:text-gray-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Table status + QR import banner */}
      {orderType === 'dine_in' && tableNumber && (
        <div className="px-4 py-2 flex-shrink-0 space-y-1.5">
          {/* Table status row */}
          <div className="flex items-center justify-between bg-[#F5F2EE] rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black tracking-widest uppercase text-gray-400">Dine-In Table:</span>
              <span className="font-black text-gray-900 text-sm">{tableNumber}</span>
            </div>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: '#EF4444' }}>
              ● OCCUPIED
            </span>
          </div>

          {/* QR import banner */}
          {sourceQrOrderId && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: '#DCFCE7', border: '1.5px solid #86EFAC' }}>
              <div className="flex items-center gap-2">
                <QrCode size={13} className="text-green-600" />
                <span className="text-[11px] font-bold text-green-800">Imported via Table QR code!</span>
              </div>
              <button
                onClick={() => setSourceQrOrderId(null)}
                className="flex items-center gap-1 text-[10px] font-bold text-green-700 hover:text-red-600 transition-colors"
              >
                <Unlink size={11} />
                Disconnect
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lines */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: `${P}12` }}
            >
              <ShoppingCart size={24} style={{ color: P }} />
            </div>
            <p className="text-gray-400 text-sm font-semibold">Cart is empty</p>
            <p className="text-gray-300 text-xs mt-1">Tap a menu item to add</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {lines.map((line, i) => (
              <CartLine key={line.lineId} line={line} index={i} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      {!isEmpty && (
        <div className="flex-shrink-0 border-t border-gray-100 px-4 pt-3 pb-4 space-y-3">

          {/* Discount code input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={discountCode}
              onChange={e => setDiscountCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleApplyCode()}
              placeholder="Discount Code (e.g. foodics15)"
              className="flex-1 px-3 py-2 rounded-xl text-xs text-gray-700 bg-[#F5F2EE] outline-none placeholder:text-gray-400"
              style={{ border: '1.5px solid transparent' }}
              onFocus={e => (e.currentTarget.style.borderColor = `${P}60`)}
              onBlur={e => (e.currentTarget.style.borderColor = 'transparent')}
            />
            <button
              onClick={handleApplyCode}
              className="px-3 py-2 rounded-xl text-xs font-black text-white flex-shrink-0"
              style={{ background: '#1A1208' }}
            >
              Apply
            </button>
          </div>

          {/* Quick discount buttons */}
          <div className="flex gap-1.5">
            {QUICK_DISCOUNTS.map(pct => {
              const active = discountType === 'percent' && discountValue === pct
              return (
                <button
                  key={pct}
                  onClick={() => active ? clearDiscount() : setDiscount('percent', pct)}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all"
                  style={{
                    background: active ? P : '#F5F2EE',
                    color: active ? 'white' : '#9A8A7A',
                    boxShadow: active ? `0 2px 8px rgba(255,107,53,0.35)` : 'none',
                  }}
                >
                  {pct}% OFF
                </button>
              )
            })}
          </div>

          {/* Split bill */}
          <button
            onClick={() => setShowSplit(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold bg-[#F5F2EE] text-gray-500 hover:bg-[#EDE9E4] transition-colors"
          >
            <Scissors size={11} />
            Split Bill
          </button>

          {/* Totals */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span className="font-semibold">Discount {discountType === 'percent' ? `${discountValue}%` : ''}:</span>
                <span className="font-black">-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Saudi Inclusive VAT ({taxPercent}%):</span>
              <span className="font-semibold">{formatPrice(taxAmount)}</span>
            </div>
            <div className="flex justify-between items-baseline border-t border-gray-200 pt-2">
              <span className="font-black text-gray-900 text-sm">Grand Total:</span>
              <span className="font-black text-2xl" style={{ color: '#EF4444' }}>{formatPrice(total)}</span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center bg-red-50 rounded-xl py-2 px-3">{error}</p>
          )}

          {/* Checkout button */}
          <button
            onClick={() => { setError(''); clearPayments(); setShowPayment(true) }}
            className="w-full py-4 rounded-2xl font-black text-white text-base transition-opacity active:opacity-80 flex items-center justify-center gap-2"
            style={{
              background: '#EF4444',
              boxShadow: '0 6px 24px rgba(239,68,68,0.35)',
              letterSpacing: '0.02em',
            }}
          >
            <CreditCard size={18} />
            Waiter Checkout
          </button>
        </div>
      )}

      {/* Modals */}
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onConfirm={handleConfirmOrder}
        loading={loading}
      />
      <SplitBillModal open={showSplit} onClose={() => setShowSplit(false)} />
      <ReceiptModal
        open={showReceipt}
        onClose={handleReceiptClose}
        orderNumber={lastOrderNumber}
        orderId={lastOrderId}
      />
    </div>
  )
}
