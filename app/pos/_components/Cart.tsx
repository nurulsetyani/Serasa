'use client'
import { AnimatePresence } from 'framer-motion'
import { ShoppingCart, Trash2, Scissors, Receipt, Phone, MapPin, CreditCard, QrCode, UtensilsCrossed, ShoppingBag, LayoutGrid, PlusCircle, X, CheckCheck, Tag } from 'lucide-react'
import { useState, useRef } from 'react'
import { usePOSStore } from '@/stores/pos.store'
import { formatPrice } from '@/lib/utils'
import CartLine from './CartLine'
import PaymentModal from './PaymentModal'
import SplitBillModal from './SplitBillModal'
import ReceiptModal from './ReceiptModal'
import TablePicker from './TablePicker'

const P = '#FF6B35'

interface Props {
  tableParam?: string
}


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
  const setOrderType = usePOSStore(s => s.setOrderType)
  const clearPayments = usePOSStore(s => s.clearPayments)
  const payments = usePOSStore(s => s.payments)
  const sourceQrOrderId = usePOSStore(s => s.sourceQrOrderId)
  const editOrderId = usePOSStore(s => s.editOrderId)
  const editOrderMeta = usePOSStore(s => s.editOrderMeta)
  const exitEditMode = usePOSStore(s => s.exitEditMode)

  const getSubtotal = usePOSStore(s => s.getSubtotal)
  const getDiscountAmount = usePOSStore(s => s.getDiscountAmount)
  const getTaxAmount = usePOSStore(s => s.getTaxAmount)
  const getTotal = usePOSStore(s => s.getTotal)

  const [showPayment, setShowPayment] = useState(false)
  const [showSplit, setShowSplit] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showTables, setShowTables] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastOrderNumber, setLastOrderNumber] = useState<string | undefined>()
  const [lastOrderId, setLastOrderId] = useState<string | undefined>()
  const [sarInput, setSarInput] = useState('')
  const sarRef = useRef<HTMLInputElement>(null)

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const taxAmount = getTaxAmount()
  const total = getTotal()
  const isEmpty = lines.length === 0
  const totalQty = lines.reduce((s, l) => s + l.qty, 0)


  function handleApplySAR() {
    const val = parseFloat(sarInput.replace(',', '.'))
    if (!isNaN(val) && val > 0) {
      setDiscount('fixed', val)
      setSarInput('')
    }
  }


  function queueCashierPrint(order: {
    id: string
    order_number?: string
    table_number?: string
    customer_name?: string
    order_type?: string
    payment_method?: string
    created_at?: string
  }) {
    fetch('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'cashier',
        order: {
          id: order.id,
          order_number: order.order_number,
          table_number: order.table_number ?? tableNumber ?? tableParam ?? '1',
          customer_name: order.customer_name ?? customerName ?? 'Guest',
          order_type: order.order_type ?? orderType,
          payment_method: payments[0]?.method ?? order.payment_method ?? 'cash',
          total_price: total,
          subtotal,
          discount_type: discountType,
          discount_value: discountValue,
          discount_amount: discountAmount,
          tax_percent: taxPercent,
          tax_amount: taxAmount,
          payments,
          created_at: order.created_at ?? new Date().toISOString(),
          order_items: lines.map(l => {
            const modSum = l.modifiers.reduce((s, m) => s + m.priceAdj, 0)
            return {
              id: l.lineId,
              name: l.name,
              name_ar: l.name_ar,
              price: l.unitPrice + modSum,
              qty: l.qty,
              notes: l.note || null,
            }
          }),
        },
      }),
    }).catch(() => {})
  }

  async function handleConfirmOrder() {
    if (loading || isEmpty) return
    setLoading(true); setError('')
    try {
      // ── QR checkout: update original order, don't create a new one ──
      if (sourceQrOrderId) {
        const res = await fetch(`/api/order/${sourceQrOrderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'paid', total_price: total }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to update order')
        setLastOrderNumber(data.order_number)
        setLastOrderId(sourceQrOrderId)
        queueCashierPrint(data)
        setShowPayment(false)
        setShowReceipt(true)
        return
      }

      // ── POS walk-in order: create new order ──
      const res = await fetch('/api/pos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'pos',
          customer_name: customerName || 'Guest',
          customer_phone: customerPhone || null,
          table_number: tableNumber || tableParam || '1',
          order_type: orderType,
          payment_method: payments[0]?.method ?? 'cash',
          delivery_address: orderType === 'delivery' ? deliveryAddress : null,
          subtotal,
          discount_type: discountType,
          discount_value: discountValue,
          discount_amount: discountAmount,
          tax_percent: taxPercent,
          tax_amount: taxAmount,
          total_price: total,
          items: lines.map(l => ({
            menu_id: l.menuId, name: l.name, price: l.unitPrice,
            qty: l.qty, notes: l.note || null, modifiers: l.modifiers,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create order')
      setLastOrderNumber(data.order_number)
      setLastOrderId(data.id)
      queueCashierPrint(data)
      setShowPayment(false)
      setShowReceipt(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddToOrder() {
    if (!editOrderId || isEmpty) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/order/${editOrderId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map(l => ({
            menu_id: l.menuId || undefined,
            name: l.name,
            price: l.unitPrice,
            qty: l.qty,
            notes: l.note || undefined,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal menambah item')
      exitEditMode()
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
      {/* Edit Mode Banner */}
      {editOrderId && editOrderMeta && (
        <div className="px-4 py-3 flex-shrink-0" style={{ background: '#DCFCE7', borderBottom: '1.5px solid #86EFAC' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlusCircle size={14} className="text-green-700" />
              <div>
                <p className="font-black text-green-900 text-xs">Edit Order #{editOrderMeta.orderNumber}</p>
                <p className="text-[10px] text-green-700">Meja {editOrderMeta.tableNumber} · {editOrderMeta.customerName}</p>
              </div>
            </div>
            <button onClick={exitEditMode} className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center hover:bg-green-300">
              <X size={11} className="text-green-800" />
            </button>
          </div>
          {/* Existing items summary */}
          <div className="mt-2 space-y-1 pt-2 border-t border-green-200">
            <p className="text-[9px] font-black tracking-widest uppercase text-green-600 mb-1">Sudah Dipesan</p>
            {editOrderMeta.existingItems.map(i => (
              <div key={i.id} className="flex justify-between text-[11px] text-green-800">
                <span>{i.name} × {i.qty}</span>
                <span className="font-bold">{formatPrice(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cart Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} style={{ color: P }} />
            <span className="font-black text-gray-900 text-sm">
              {editOrderId ? 'Item Tambahan' : 'Cart / السلة'}
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
            {!isEmpty && !editOrderId && (
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

        {/* Order Type toggle */}
        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-full mb-3">
          <button
            onClick={() => setOrderType('dine_in')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-black transition-all"
            style={{
              background: orderType !== 'take_away' ? P : 'transparent',
              color: orderType !== 'take_away' ? 'white' : '#9A8A7A',
              boxShadow: orderType !== 'take_away' ? `0 3px 8px rgba(255,107,53,0.35)` : 'none',
            }}
          >
            <UtensilsCrossed size={11} />
            Dine-In
          </button>
          <button
            onClick={() => setOrderType('take_away')}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-black transition-all"
            style={{
              background: orderType === 'take_away' ? P : 'transparent',
              color: orderType === 'take_away' ? 'white' : '#9A8A7A',
              boxShadow: orderType === 'take_away' ? `0 3px 8px rgba(255,107,53,0.35)` : 'none',
            }}
          >
            <ShoppingBag size={11} />
            Take Away
          </button>
        </div>

        {/* Table & Customer */}
        <div className="grid grid-cols-2 gap-2">
          {orderType !== 'delivery' ? (
            <div className="bg-[#F5F2EE] rounded-xl px-3 py-2 cursor-pointer"
              onClick={() => setShowTables(true)}>
              <p className="text-[9px] font-black tracking-widest uppercase text-gray-400 mb-1 flex items-center justify-between">
                Table No.
                <LayoutGrid size={9} className="text-gray-400" />
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tableNumber}
                  onChange={e => setTable(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  placeholder={tableParam ?? '–'}
                  className="w-full text-sm font-black text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
                />
              </div>
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
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: '#DCFCE7', border: '1.5px solid #86EFAC' }}>
              <QrCode size={13} className="text-green-600" />
              <span className="text-[11px] font-bold text-green-800">Imported via Table QR code!</span>
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

          {/* Diskon SAR */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F5F2EE]">
              <Tag size={11} className="text-gray-400 flex-shrink-0" />
              <span className="text-[11px] font-black text-gray-400">SAR</span>
              <input
                ref={sarRef}
                type="number"
                min="0"
                step="0.5"
                value={sarInput}
                onChange={e => setSarInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleApplySAR()}
                placeholder="Diskon riyal..."
                className="flex-1 text-sm font-black text-gray-900 bg-transparent outline-none w-full placeholder:text-gray-300 placeholder:font-normal"
              />
            </div>
            {discountType === 'fixed' ? (
              <button
                onClick={() => { clearDiscount(); setSarInput('') }}
                className="px-3 py-2 rounded-xl text-[11px] font-black text-red-400 bg-red-50"
              >
                <X size={13} />
              </button>
            ) : (
              <button
                onClick={handleApplySAR}
                disabled={!sarInput || parseFloat(sarInput) <= 0}
                className="px-3 py-2 rounded-xl text-[11px] font-black text-white disabled:opacity-40"
                style={{ background: P }}
              >
                Terapkan
              </button>
            )}
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
                <span className="font-semibold">
                  Diskon {discountType === 'percent' ? `${discountValue}%` : `SAR ${discountValue}`}:
                </span>
                <span className="font-black">-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-end border-t border-gray-100 pt-3 mt-1">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider font-inter mb-0.5">Grand Total</p>
              </div>
              <span className="font-bold text-[28px] leading-none tracking-tight font-inter" style={{ color: '#EF4444' }}>{formatPrice(total)}</span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center bg-red-50 rounded-xl py-2 px-3">{error}</p>
          )}

          {/* Edit mode: Tambahkan ke Order */}
          {editOrderId ? (
            <button
              onClick={handleAddToOrder}
              disabled={loading || isEmpty}
              className="w-full py-4 rounded-2xl font-bold text-white text-[15px] active:scale-[0.98] flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                boxShadow: '0 8px 24px rgba(34,197,94,0.40)',
                letterSpacing: '0.01em',
              }}
            >
              {loading ? '...' : <><CheckCheck size={17} />Tambahkan ke Order</>}
            </button>
          ) : (
            /* Normal: Checkout */
            <button
              onClick={() => { setError(''); clearPayments(); setShowPayment(true) }}
              className="w-full py-4 rounded-2xl font-bold text-white text-[15px] font-inter active:scale-[0.98] flex items-center justify-center gap-2 transition-[box-shadow,transform,opacity] duration-150"
              style={{
                background: 'linear-gradient(135deg, #EF4444 0%, #E02020 100%)',
                boxShadow: 'var(--pos-shadow-red)',
                letterSpacing: '0.01em',
              }}
            >
              <CreditCard size={17} />
              Waiter Checkout
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <TablePicker open={showTables} onClose={() => setShowTables(false)} />
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
