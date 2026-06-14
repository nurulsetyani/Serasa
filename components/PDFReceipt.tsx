'use client'
import {
  Document, Page, Text, View, Image, StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer'
import { Download } from 'lucide-react'

const RED    = '#CC0000'
const DARK   = '#1A1208'
const GRAY   = '#1A1208'
const LGRAY  = '#1A1208'

const TAX_PERCENT = 15

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    padding: '8mm',
    width: '80mm',
  },
  center: { alignItems: 'center' },
  restoName: { color: RED, fontSize: 14, fontWeight: 700, textAlign: 'center' },
  branchName: { color: GRAY, fontSize: 9, textAlign: 'center', marginTop: 2 },
  invoiceNo: { color: LGRAY, fontSize: 7.5, textAlign: 'center', marginTop: 1 },
  divider: { borderTop: '1px dashed #D1D5DB', marginVertical: 5 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  metaLabel: { color: GRAY, fontSize: 9 },
  metaValue: { color: DARK, fontSize: 9, fontWeight: 700, textAlign: 'right', maxWidth: '60%' },
  metaValueRed: { color: RED, fontSize: 9, fontWeight: 700, textAlign: 'right' },
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #E5E7EB', paddingBottom: 3, marginBottom: 4 },
  thLeft: { flex: 1, color: GRAY, fontSize: 8 },
  thMid: { width: 24, color: GRAY, fontSize: 8, textAlign: 'center' },
  thRight: { width: 60, color: GRAY, fontSize: 8, textAlign: 'right' },
  itemRow: { marginBottom: 5 },
  itemInner: { flexDirection: 'row', alignItems: 'flex-start' },
  itemName: { flex: 1, color: DARK, fontSize: 10, fontWeight: 700, lineHeight: 1.3 },
  itemQty: { width: 24, color: GRAY, fontSize: 10, textAlign: 'center' },
  itemTotal: { width: 60, color: DARK, fontSize: 10, fontWeight: 700, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  totalLabel: { color: GRAY, fontSize: 9 },
  totalValue: { color: DARK, fontSize: 9, fontWeight: 700 },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  grandLabel: { color: DARK, fontSize: 12.5, fontWeight: 700 },
  grandValue: { color: DARK, fontSize: 12.5, fontWeight: 700 },
  discountValue: { color: '#16A34A', fontSize: 9, fontWeight: 700 },
  discountLabel: { color: '#16A34A', fontSize: 9 },
  complianceText: { color: LGRAY, fontSize: 7, textAlign: 'center', lineHeight: 1.4, marginVertical: 5 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1.5 },
  payLabel: { color: GRAY, fontSize: 9 },
  payValue: { color: DARK, fontSize: 9, fontWeight: 700 },
  changeLabel: { color: '#16A34A', fontSize: 9.5, fontWeight: 700 },
  changeValue: { color: '#16A34A', fontSize: 9.5, fontWeight: 700 },
})

function fmt(n: number) {
  return `${n.toFixed(2)} SAR`
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-SA', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${d.toLocaleTimeString('en-SA', { hour: '2-digit', minute: '2-digit', hour12: false })}`
}

export interface ReceiptItem {
  id: string
  name: string
  name_ar?: string
  price: number
  qty: number
  notes?: string | null
}

export interface PDFReceiptProps {
  orderNumber?: string
  tableNumber: string
  customerName: string
  orderType: string
  paymentMethod?: string
  createdAt: string
  items: ReceiptItem[]
  subtotal: number
  discountType?: string | null
  discountValue?: number
  discountAmount?: number
  taxPercent?: number
  taxAmount?: number
  total: number
  payments?: { method: string; amount: number }[]
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  mada: 'Mada',
  visa: 'Visa/MC',
  qris: 'QRIS',
  transfer: 'Bank Transfer',
  online: 'Online',
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: 'DINE IN',
  take_away: 'TAKE AWAY',
  delivery: 'DELIVERY',
}

function ReceiptDocument({ data, logoUrl, restoName, branchName, vatReg }: {
  data: PDFReceiptProps
  logoUrl?: string
  restoName: string
  branchName: string
  vatReg: string
}) {
  const taxPct = data.taxPercent ?? TAX_PERCENT
  const total = data.total
  // VAT-inclusive breakdown
  const taxableAmount = total > 0 ? +(total / (1 + taxPct / 100)).toFixed(2) : 0
  const vatAmount = +(total - taxableAmount).toFixed(2)

  const change = data.payments
    ? Math.max(0, data.payments.reduce((s, p) => s + p.amount, 0) - total)
    : 0

  const invoiceNo = data.orderNumber ? `INV-${data.orderNumber}` : `INV-${Date.now().toString().slice(-6)}`

  return (
    <Document>
      <Page size={[226.77, 900]} style={s.page}>
        {/* Restaurant name */}
        <View style={s.center}>
          {logoUrl && <Image style={{ width: 100, height: 32, objectFit: 'contain', marginBottom: 3 }} src={logoUrl} />}
          <Text style={s.restoName}>{restoName}</Text>
          <Text style={s.branchName}>{branchName}</Text>
          <Text style={s.invoiceNo}>{invoiceNo}</Text>
        </View>

        <View style={s.divider} />

        {/* Meta */}
        <View style={s.metaRow}>
          <Text style={s.metaLabel}>VAT Reg. No.:</Text>
          <Text style={s.metaValue}>{vatReg}</Text>
        </View>
        <View style={s.metaRow}>
          <Text style={s.metaLabel}>Date:</Text>
          <Text style={s.metaValue}>{fmtDate(data.createdAt)}</Text>
        </View>
        <View style={s.metaRow}>
          <Text style={s.metaLabel}>Operator:</Text>
          <Text style={s.metaValue}>{data.customerName || 'Cashier'}</Text>
        </View>
        <View style={s.metaRow}>
          <Text style={s.metaLabel}>Order Type:</Text>
          <Text style={s.metaValue}>{ORDER_TYPE_LABELS[data.orderType] || data.orderType}</Text>
        </View>
        <View style={s.metaRow}>
          <Text style={s.metaLabel}>Table No.:</Text>
          <Text style={s.metaValueRed}>{data.tableNumber || '—'}</Text>
        </View>

        <View style={s.divider} />

        {/* Items table header */}
        <View style={s.tableHeader}>
          <Text style={s.thLeft}>Item</Text>
          <Text style={s.thMid}>Qty</Text>
          <Text style={s.thRight}>Total SAR</Text>
        </View>

        {/* Items */}
        {data.items.map(item => (
          <View key={item.id} style={s.itemRow}>
            <View style={s.itemInner}>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{item.name}</Text>
                {item.notes && <Text style={{ color: '#9CA3AF', fontSize: 7, fontStyle: 'italic' }}>{item.notes}</Text>}
              </View>
              <Text style={s.itemQty}>{item.qty}</Text>
              <Text style={s.itemTotal}>{fmt(item.price * item.qty)}</Text>
            </View>
          </View>
        ))}

        <View style={s.divider} />

        {/* Totals */}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Subtotal:</Text>
          <Text style={s.totalValue}>{fmt(data.subtotal)}</Text>
        </View>

        {(data.discountAmount ?? 0) > 0 && (
          <View style={s.totalRow}>
            <Text style={s.discountLabel}>
              Discount {data.discountType === 'percent' ? `${data.discountValue}%` : ''}:
            </Text>
            <Text style={s.discountValue}>-{fmt(data.discountAmount ?? 0)}</Text>
          </View>
        )}

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Taxable Amount:</Text>
          <Text style={s.totalValue}>{fmt(taxableAmount)}</Text>
        </View>

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>VAT @ {taxPct}%:</Text>
          <Text style={s.totalValue}>{fmt(vatAmount)}</Text>
        </View>

        <View style={s.divider} />

        {/* Grand total */}
        <View style={s.grandRow}>
          <Text style={s.grandLabel}>Total Amount:</Text>
          <Text style={s.grandValue}>{fmt(total)}</Text>
        </View>

        {/* Payments */}
        {data.payments && data.payments.length > 0 && (
          <>
            <View style={s.divider} />
            {data.payments.map((p, i) => (
              <View key={i} style={s.payRow}>
                <Text style={s.payLabel}>{PAYMENT_LABELS[p.method] ?? p.method}</Text>
                <Text style={s.payValue}>{fmt(p.amount)}</Text>
              </View>
            ))}
            {change > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
                <Text style={s.changeLabel}>Change:</Text>
                <Text style={s.changeValue}>{fmt(change)}</Text>
              </View>
            )}
          </>
        )}

        <View style={s.divider} />

        {/* Compliance */}
        <Text style={s.complianceText}>
          This is a simplified tax invoice compliant with Saudi Arabia FATOORA Phase 2 regulations. VAT Reg: {vatReg}
        </Text>

      </Page>
    </Document>
  )
}

interface DownloadButtonProps {
  data: PDFReceiptProps
  orderNumber?: string
}

export function PDFDownloadButton({ data, orderNumber }: DownloadButtonProps) {
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logof22.png` : undefined
  const restoName = process.env.NEXT_PUBLIC_RESTO_NAME || 'SERASA RESTAURANT'
  const branchName = process.env.NEXT_PUBLIC_BRANCH_NAME || 'Kuday, Mekkah - Saudi Arabia'
  const vatReg = process.env.NEXT_PUBLIC_VAT_REG || '310000000000003'
  const filename = `invoice-${orderNumber || data.tableNumber}-${Date.now()}.pdf`

  return (
    <PDFDownloadLink
      document={<ReceiptDocument data={data} logoUrl={logoUrl} restoName={restoName} branchName={branchName} vatReg={vatReg} />}
      fileName={filename}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm disabled:opacity-50 transition-opacity"
          style={{ background: '#1A1208', color: 'white' }}
        >
          <Download size={14} />
          {loading ? 'Preparing...' : 'Download PDF'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
