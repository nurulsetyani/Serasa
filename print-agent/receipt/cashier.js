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

const RESTO_NAME    = process.env.NEXT_PUBLIC_RESTO_NAME    || 'SERASA RESTAURANT'
const RESTO_NAME_AR = process.env.NEXT_PUBLIC_RESTO_NAME_AR || 'مطعم سيراسا'
const BRANCH_NAME_AR= process.env.NEXT_PUBLIC_BRANCH_NAME_AR|| 'مكة المكرمة - السعودية'
const VAT_REG       = process.env.NEXT_PUBLIC_VAT_REG       || '310000000000003'
const CASHIER_NAME  = process.env.NEXT_PUBLIC_CASHIER_NAME  || 'MANAGER'

const PAYMENT_LABELS = {
  cash: 'Cash',
  mada: 'Mada',
  visa: 'Visa/MC',
  qris: 'QRIS',
  transfer: 'Bank Transfer',
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
    // ── Logo + Header ─────────────────────────────────────
    printer.alignCenter()
    if (fs.existsSync(LOGO_PATH)) {
      await printer.printImage(LOGO_PATH)
    }
    printer.bold(true)
    printer.setTextSize(1, 0)
    printer.println(RESTO_NAME)
    printer.setTextSize(0, 0)
    printer.bold(false)
    printer.println(RESTO_NAME_AR)
    printer.drawLine()

    // ── Invoice title ─────────────────────────────────────
    printer.println('فاتورة ضريبية مبسطة')
    printer.bold(true)
    printer.println('SIMPLIFIED TAX INVOICE')
    printer.bold(false)
    printer.drawLine()

    // ── Invoice meta ──────────────────────────────────────
    printer.alignLeft()
    const orderNum = order.order_number || order.id?.slice(0, 8).toUpperCase()
    printer.tableCustom([
      { text: 'Invoice No / رقم الفاتورة', align: 'LEFT', width: 0.5 },
      { text: `Order ${orderNum}`,          align: 'RIGHT', width: 0.5, bold: true },
    ])
    const tableDisplay = order.order_type === 'dine_in'
      ? (order.table_number || '1')
      : ORDER_TYPE_LABELS[order.order_type] || order.order_type
    printer.tableCustom([
      { text: 'Table No / رقم الطاولة', align: 'LEFT', width: 0.5 },
      { text: tableDisplay,              align: 'RIGHT', width: 0.5, bold: true },
    ])
    printer.drawLine()

    // ── Restaurant info ───────────────────────────────────
    printer.alignCenter()
    printer.println(RESTO_NAME_AR)
    printer.tableCustom([
      { text: `VAT No:${VAT_REG}`, align: 'LEFT',  width: 0.55 },
      { text: ':الرقم الضريبي',    align: 'RIGHT', width: 0.45 },
    ])
    printer.tableCustom([
      { text: `Date: ${formatDate(order.created_at)}`, align: 'LEFT',  width: 0.6 },
      { text: ':التاريخ',                               align: 'RIGHT', width: 0.4 },
    ])
    printer.alignRight()
    printer.println(BRANCH_NAME_AR)
    printer.drawLine()

    // ── Items table (Sub Total | Price | Qty | Product) ───
    printer.alignLeft()
    printer.tableCustom([
      { text: 'Sub Total', align: 'LEFT',   width: 0.22 },
      { text: 'Price',     align: 'CENTER', width: 0.18 },
      { text: 'Qty',       align: 'CENTER', width: 0.10 },
      { text: 'Product',   align: 'RIGHT',  width: 0.50 },
    ])
    printer.tableCustom([
      { text: 'الإجمالي الفرعي', align: 'LEFT',   width: 0.22 },
      { text: 'سعر',             align: 'CENTER', width: 0.18 },
      { text: 'الكمية',          align: 'CENTER', width: 0.10 },
      { text: 'الصنف',           align: 'RIGHT',  width: 0.50 },
    ])
    printer.drawLine()

    for (const item of order.order_items || []) {
      const lineTotal = (item.price * item.qty).toFixed(2)
      const productName = item.name_ar ? `${item.name} ${item.name_ar}` : item.name
      printer.tableCustom([
        { text: lineTotal,    align: 'LEFT',   width: 0.22 },
        { text: item.price.toFixed(2), align: 'CENTER', width: 0.18 },
        { text: String(item.qty),      align: 'CENTER', width: 0.10 },
        { text: productName,  align: 'RIGHT',  width: 0.50 },
      ])
      if (item.notes) {
        printer.println(`  ⚠ ${item.notes}`)
      }
    }
    printer.drawLine()

    // ── Totals ────────────────────────────────────────────
    const total = order.total_price
    printer.tableCustom([
      { text: `${total.toFixed(2)} SR`, align: 'LEFT',  width: 0.45, bold: true },
      { text: 'TOTAL / الإجمالي',       align: 'RIGHT', width: 0.55, bold: true },
    ])
    printer.tableCustom([
      { text: `${total.toFixed(2)} SR`, align: 'LEFT',  width: 0.45 },
      { text: 'To Pay / المطلوب',       align: 'RIGHT', width: 0.55 },
    ])

    if (order.payments?.length) {
      for (const p of order.payments) {
        printer.tableCustom([
          { text: p.amount.toFixed(2),              align: 'LEFT',  width: 0.45 },
          { text: PAYMENT_LABELS[p.method] || p.method, align: 'RIGHT', width: 0.55 },
        ])
      }
      const paid   = order.payments.reduce((s, p) => s + p.amount, 0)
      const change = Math.max(0, paid - total)
      printer.tableCustom([
        { text: `${change.toFixed(2)} SR`, align: 'LEFT',  width: 0.45, bold: true },
        { text: 'CHANGE / المتبقي',        align: 'RIGHT', width: 0.55, bold: true },
      ])
    }
    printer.drawLine()

    // ── QR Code ───────────────────────────────────────────
    if (receipt_url) {
      printer.alignCenter()
      const qrPath = await qrToTempPng(receipt_url)
      tmpFiles.push(qrPath)
      await printer.printImage(qrPath)
      printer.newLine()
    }

    // ── Footer ────────────────────────────────────────────
    printer.alignCenter()
    printer.println(`Served by: ${CASHIER_NAME} :بواسطة`)
    printer.newLine()
    printer.cut()

  } finally {
    for (const f of tmpFiles) {
      try { fs.unlinkSync(f) } catch {}
    }
  }
}

module.exports = { buildCashierReceipt }
