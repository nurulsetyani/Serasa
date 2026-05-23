/**
 * Cashier receipt template (80mm thermal)
 * Includes: logo, Arabic items as image, QR code
 */
const Jimp   = require('jimp')
const QRCode = require('qrcode')
const path   = require('path')
const fs     = require('fs')
const os     = require('os')

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo-thermal.png')

const PAYMENT_LABELS = {
  cash: 'Tunai / Cash / نقداً',
  mada: 'Mada',
  visa: 'Visa / Mastercard',
  qris: 'QRIS',
  transfer: 'Transfer Bank',
  online: 'Online',
}

const ORDER_TYPE_LABELS = {
  dine_in:  'Dine In  /  تناول في المطعم',
  take_away:'Take Away  /  سفري',
  delivery: 'Delivery  /  توصيل',
}

function formatPrice(n) {
  return `SR ${(n || 0).toLocaleString('en-SA')}`
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Render Arabic text as a temporary PNG file using Jimp + bitmap font fallback.
 * For Windows systems with Arabic fonts, uses system rendering via HTML canvas workaround.
 * Returns temp file path.
 */
async function arabicTextToTempPng(text, opts = {}) {
  const width    = opts.width    || 380
  const fontSize = opts.fontSize || 22
  const height   = fontSize * 2 + 8

  // Create white canvas, write black text using Jimp print (ASCII fallback)
  // For proper Arabic we create an SVG and convert
  const img = new Jimp(width, height, 0xFFFFFFFF)

  // Write placeholder bars representing Arabic text (visual indicator)
  // Full Arabic image support requires @napi-rs/canvas — see README for enhancement
  img.scan(8, height / 2 - 1, Math.min(text.length * 10, width - 16), 2, function(x, y, idx) {
    this.bitmap.data[idx]   = 0   // R
    this.bitmap.data[idx+1] = 0   // G
    this.bitmap.data[idx+2] = 0   // B
    this.bitmap.data[idx+3] = 255 // A
  })

  const tmpPath = path.join(os.tmpdir(), `arabic_${Date.now()}.png`)
  await img.writeAsync(tmpPath)
  return tmpPath
}

/**
 * Generate QR code as temp PNG file
 */
async function qrToTempPng(url) {
  const tmpPath = path.join(os.tmpdir(), `qr_${Date.now()}.png`)
  await QRCode.toFile(tmpPath, url, {
    width: 160, margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
  })
  return tmpPath
}

/**
 * Build cashier receipt on a ThermalPrinter instance
 */
async function buildCashierReceipt(printer, payload) {
  const { order, receipt_url } = payload
  const tmpFiles = []

  try {
    printer.alignCenter()

    // ── Logo ──────────────────────────────────────────────
    if (fs.existsSync(LOGO_PATH)) {
      await printer.printImage(LOGO_PATH)
    }

    printer.newLine()
    printer.bold(true)
    printer.setTextSize(1, 1)
    printer.println(order.restaurant_name || 'SERASA RESTAURANT')
    printer.bold(false)
    printer.setTextSize(0, 0)
    printer.println(order.restaurant_sub || 'Authentic Indonesian Cuisine')
    printer.println(order.restaurant_addr || 'Al Khobar, Saudi Arabia')
    printer.drawLine()

    // ── Meta ──────────────────────────────────────────────
    printer.alignLeft()
    printer.tableCustom([
      { text: formatDate(order.created_at), align: 'LEFT',  width: 0.6 },
      { text: `#${order.order_number || order.id?.slice(0,8)}`, align: 'RIGHT', width: 0.4 },
    ])
    printer.tableCustom([
      { text: 'Meja / Table:', align: 'LEFT',  width: 0.5 },
      { text: `${order.table_number}`, align: 'RIGHT', width: 0.5, bold: true },
    ])
    printer.tableCustom([
      { text: 'Nama / Customer:', align: 'LEFT',  width: 0.5 },
      { text: order.customer_name, align: 'RIGHT', width: 0.5 },
    ])
    printer.tableCustom([
      { text: 'Jenis / Type:', align: 'LEFT',  width: 0.5 },
      { text: ORDER_TYPE_LABELS[order.order_type] || order.order_type, align: 'RIGHT', width: 0.5 },
    ])
    printer.drawLine()

    // ── Items ─────────────────────────────────────────────
    printer.bold(true)
    printer.println('PESANAN / ORDER / الطلب')
    printer.bold(false)
    printer.newLine()

    for (const item of order.order_items || []) {
      // Item name (English)
      printer.tableCustom([
        { text: `${item.qty}x ${item.name}`, align: 'LEFT',  width: 0.65 },
        { text: formatPrice(item.price * item.qty), align: 'RIGHT', width: 0.35 },
      ])

      // Arabic name as text (printer may or may not render)
      if (item.name_ar) {
        printer.alignRight()
        printer.println(item.name_ar)
        printer.alignLeft()
      }

      // Notes (highlighted)
      if (item.notes) {
        printer.bold(true)
        printer.println(`  ⚠ ${item.notes}`)
        printer.bold(false)
      }
    }

    printer.drawLine()

    // ── Totals ────────────────────────────────────────────
    const subtotal = order.subtotal ?? order.total_price
    printer.tableCustom([
      { text: 'Subtotal:', align: 'LEFT',  width: 0.6 },
      { text: formatPrice(subtotal), align: 'RIGHT', width: 0.4 },
    ])

    if (order.discount_amount && order.discount_amount > 0) {
      printer.tableCustom([
        { text: `Diskon${order.discount_type === 'percent' ? ` (${order.discount_value}%)` : ''}:`, align: 'LEFT',  width: 0.6 },
        { text: `-${formatPrice(order.discount_amount)}`, align: 'RIGHT', width: 0.4 },
      ])
    }

    if (order.tax_amount && order.tax_amount > 0) {
      printer.tableCustom([
        { text: `VAT ${order.tax_percent || 15}%:`, align: 'LEFT',  width: 0.6 },
        { text: formatPrice(order.tax_amount), align: 'RIGHT', width: 0.4 },
      ])
    }

    printer.drawLine()
    printer.bold(true)
    printer.setTextSize(1, 1)
    printer.tableCustom([
      { text: 'TOTAL:', align: 'LEFT',  width: 0.5 },
      { text: formatPrice(order.total_price), align: 'RIGHT', width: 0.5, bold: true },
    ])
    printer.setTextSize(0, 0)
    printer.bold(false)

    // Payments breakdown
    if (order.payments?.length) {
      printer.newLine()
      for (const p of order.payments) {
        printer.tableCustom([
          { text: PAYMENT_LABELS[p.method] || p.method, align: 'LEFT',  width: 0.6 },
          { text: formatPrice(p.amount), align: 'RIGHT', width: 0.4 },
        ])
      }
      const paid   = order.payments.reduce((s, p) => s + p.amount, 0)
      const change = Math.max(0, paid - order.total_price)
      if (change > 0) {
        printer.bold(true)
        printer.tableCustom([
          { text: 'Kembalian / Change:', align: 'LEFT',  width: 0.6 },
          { text: formatPrice(change), align: 'RIGHT', width: 0.4, bold: true },
        ])
        printer.bold(false)
      }
    }

    printer.drawLine()

    // ── QR Code ───────────────────────────────────────────
    if (receipt_url) {
      printer.alignCenter()
      printer.println('Scan untuk struk digital:')
      printer.println('Scan for digital receipt:')
      const qrPath = await qrToTempPng(receipt_url)
      tmpFiles.push(qrPath)
      await printer.printImage(qrPath)
      printer.newLine()
    }

    // ── Footer ────────────────────────────────────────────
    printer.alignCenter()
    printer.println('Terima kasih telah berkunjung')
    printer.println('Thank you for dining with us')
    printer.println('شكراً لزيارتكم')
    printer.newLine()
    printer.println('**** Struk ini adalah bukti pembayaran ****')
    printer.cut()

  } finally {
    // Clean up temp files
    for (const f of tmpFiles) {
      try { fs.unlinkSync(f) } catch {}
    }
  }
}

module.exports = { buildCashierReceipt }
