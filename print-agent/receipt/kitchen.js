/**
 * Kitchen receipt template (80mm thermal)
 * Minimal: table number BIG, items + notes, no prices
 */

const ORDER_TYPE_LABELS = {
  dine_in:  '🍽 DINE IN',
  take_away:'🛍 TAKE AWAY',
  delivery: '🚗 DELIVERY',
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

async function buildKitchenReceipt(printer, payload) {
  const { order } = payload

  printer.alignCenter()

  // ── Order type badge ───────────────────────────────────
  printer.bold(true)
  printer.setTextSize(0, 0)
  printer.println('─────────── DAPUR ───────────')
  printer.println(ORDER_TYPE_LABELS[order.order_type] || order.order_type.toUpperCase())
  printer.bold(false)

  // ── Table number VERY BIG ──────────────────────────────
  printer.newLine()
  printer.bold(true)
  printer.setTextSize(3, 3)   // max size
  printer.println(`${order.table_number}`)
  printer.setTextSize(0, 0)
  printer.bold(false)
  printer.println(`MEJA / TABLE`)
  printer.newLine()

  // ── Order number ──────────────────────────────────────
  printer.setTextSize(1, 1)
  printer.println(`#${order.order_number || order.id?.slice(0,8)}`)
  printer.setTextSize(0, 0)

  // ── Customer + time ───────────────────────────────────
  printer.tableCustom([
    { text: order.customer_name, align: 'LEFT',  width: 0.6 },
    { text: formatTime(order.created_at), align: 'RIGHT', width: 0.4 },
  ])

  printer.drawLine()

  // ── Items ─────────────────────────────────────────────
  printer.alignLeft()
  for (const item of order.order_items || []) {
    // Qty + Name — large
    printer.bold(true)
    printer.setTextSize(1, 1)
    printer.println(`${item.qty}x  ${item.name}`)
    printer.setTextSize(0, 0)
    printer.bold(false)

    // Arabic name
    if (item.name_ar) {
      printer.alignRight()
      printer.println(item.name_ar)
      printer.alignLeft()
    }

    // Notes — extra prominent
    if (item.notes) {
      printer.invert(true)   // white text on black background
      printer.println(` ⚠ ${item.notes} `)
      printer.invert(false)
    }

    printer.newLine()
  }

  printer.drawLine()
  printer.alignCenter()
  printer.println(`Waktu: ${formatTime(order.created_at)}`)
  printer.newLine()
  printer.cut()
}

module.exports = { buildKitchenReceipt }
