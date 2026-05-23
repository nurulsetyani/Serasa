'use client'
import {
  Document, Page, Text, View, Image, StyleSheet,
  PDFDownloadLink, Font,
} from '@react-pdf/renderer'
import { Download } from 'lucide-react'

// Register Noto font for Arabic support
Font.register({
  family: 'NotoSans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/notosans/v36/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5a7du3mhPy63rBlFpA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/notosans/v36/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcaKXdu3mhPy63rBlFpA.woff2', fontWeight: 700 },
  ],
})
Font.register({
  family: 'NotoArabic',
  src: 'https://fonts.gstatic.com/s/notonaskharabic/v33/RrQ5bpV-9Dd1b1OAGA6M9PkyDuVBePeKNaxcsss0Y7bwvc5krK0z9_Mnuw.woff2',
})

const P    = '#FF6B35'
const DARK = '#1A1208'

const s = StyleSheet.create({
  page: {
    fontFamily: 'NotoSans',
    backgroundColor: '#FFFFFF',
    padding: '8mm',
    width: '80mm',
  },
  headerBg: {
    backgroundColor: DARK,
    padding: '6mm',
    alignItems: 'center',
    borderRadius: 4,
    marginBottom: 4,
  },
  logo: { width: 120, height: 40, objectFit: 'contain' },
  sub: { color: '#9A8A7A', fontSize: 7, marginTop: 2, letterSpacing: 1 },
  orangeBar: {
    backgroundColor: P, padding: '3mm', alignItems: 'center', marginBottom: 4,
  },
  receiptTitle: { color: 'white', fontSize: 9, fontWeight: 700, letterSpacing: 2 },
  divider: { borderTop: '1px dashed #E5E7EB', marginVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  label: { color: '#9A8A7A', fontSize: 8 },
  value: { color: DARK, fontSize: 8, fontWeight: 700, textAlign: 'right', maxWidth: '55%' },
  sectionTitle: { color: '#9A8A7A', fontSize: 7, letterSpacing: 1.5, marginBottom: 3 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  itemName: { color: DARK, fontSize: 8.5, fontWeight: 700, flex: 1, marginRight: 4 },
  itemNameAr: {
    fontFamily: 'NotoArabic', color: '#6B5B4E', fontSize: 8,
    textAlign: 'right', marginTop: 1,
  },
  itemQtyPrice: { color: '#9A8A7A', fontSize: 7.5, marginTop: 1 },
  itemTotal: { color: DARK, fontSize: 8.5, fontWeight: 700, minWidth: 50, textAlign: 'right' },
  itemNote: { color: P, fontSize: 7.5, fontWeight: 700, marginTop: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 },
  totalLabel: { color: DARK, fontSize: 12, fontWeight: 700 },
  totalValue: { color: P, fontSize: 16, fontWeight: 700 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1.5 },
  payLabel: { color: '#6B5B4E', fontSize: 8 },
  payValue: { color: DARK, fontSize: 8, fontWeight: 700 },
  changeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  changeLabel: { color: '#16A34A', fontSize: 8.5, fontWeight: 700 },
  changeValue: { color: '#16A34A', fontSize: 8.5, fontWeight: 700 },
  discountLabel: { color: '#16A34A', fontSize: 8 },
  discountValue: { color: '#16A34A', fontSize: 8, fontWeight: 700 },
  footer: { alignItems: 'center', marginTop: 4 },
  footerText: { color: '#9A8A7A', fontSize: 7, marginBottom: 1.5, textAlign: 'center' },
  footerAr: {
    fontFamily: 'NotoArabic', color: '#9A8A7A', fontSize: 7,
    textAlign: 'center', marginBottom: 1.5,
  },
})

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Tunai', mada: 'Mada', visa: 'Visa/MC',
  qris: 'QRIS', transfer: 'Transfer Bank', online: 'Online',
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: 'Dine In', take_away: 'Take Away', delivery: 'Delivery',
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

function formatPrice(n: number) {
  return `SR ${n.toLocaleString('en-SA')}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function ReceiptDocument({ data, logoUrl }: { data: PDFReceiptProps; logoUrl?: string }) {
  const change = data.payments
    ? Math.max(0, data.payments.reduce((s, p) => s + p.amount, 0) - data.total)
    : 0

  return (
    <Document>
      <Page size={[226.77, 900]} style={s.page}> {/* 80mm width, auto height */}

        {/* Header */}
        <View style={s.headerBg}>
          {logoUrl && <Image style={s.logo} src={logoUrl} />}
          <Text style={s.sub}>FROM INDONESIA FOR THE WORLD</Text>
        </View>

        <View style={s.orangeBar}>
          <Text style={s.receiptTitle}>STRUK PEMBAYARAN · RECEIPT · إيصال</Text>
        </View>

        {/* Meta */}
        <View style={s.divider} />
        <View style={s.row}><Text style={s.label}>Tanggal / Date</Text><Text style={s.value}>{formatDate(data.createdAt)}</Text></View>
        {data.orderNumber && <View style={s.row}><Text style={s.label}>No. Order</Text><Text style={s.value}>{data.orderNumber}</Text></View>}
        <View style={s.row}><Text style={s.label}>Meja / Table</Text><Text style={s.value}>#{data.tableNumber}</Text></View>
        <View style={s.row}><Text style={s.label}>Nama / Customer</Text><Text style={s.value}>{data.customerName}</Text></View>
        <View style={s.row}><Text style={s.label}>Jenis / Type</Text><Text style={s.value}>{ORDER_TYPE_LABELS[data.orderType] || data.orderType}</Text></View>
        <View style={s.divider} />

        {/* Items */}
        <Text style={s.sectionTitle}>PESANAN / ORDER / الطلب</Text>
        {data.items.map(item => (
          <View key={item.id}>
            <View style={s.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{item.name}</Text>
                {item.name_ar && <Text style={s.itemNameAr}>{item.name_ar}</Text>}
                <Text style={s.itemQtyPrice}>{item.qty}× {formatPrice(item.price)}</Text>
                {item.notes && <Text style={s.itemNote}>⚠ {item.notes}</Text>}
              </View>
              <Text style={s.itemTotal}>{formatPrice(item.price * item.qty)}</Text>
            </View>
          </View>
        ))}
        <View style={s.divider} />

        {/* Totals */}
        <View style={s.row}><Text style={s.label}>Subtotal</Text><Text style={s.value}>{formatPrice(data.subtotal)}</Text></View>
        {(data.discountAmount ?? 0) > 0 && (
          <View style={s.row}>
            <Text style={s.discountLabel}>Diskon {data.discountType === 'percent' ? `${data.discountValue}%` : ''}</Text>
            <Text style={s.discountValue}>-{formatPrice(data.discountAmount ?? 0)}</Text>
          </View>
        )}
        {(data.taxAmount ?? 0) > 0 && (
          <View style={s.row}><Text style={s.label}>VAT {data.taxPercent ?? 15}%</Text><Text style={s.value}>{formatPrice(data.taxAmount ?? 0)}</Text></View>
        )}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>TOTAL</Text>
          <Text style={s.totalValue}>{formatPrice(data.total)}</Text>
        </View>

        {/* Payments */}
        {data.payments && data.payments.length > 0 && (
          <>
            <View style={s.divider} />
            {data.payments.map((p, i) => (
              <View key={i} style={s.payRow}>
                <Text style={s.payLabel}>{PAYMENT_LABELS[p.method] ?? p.method}</Text>
                <Text style={s.payValue}>{formatPrice(p.amount)}</Text>
              </View>
            ))}
            {change > 0 && (
              <View style={s.changeRow}>
                <Text style={s.changeLabel}>Kembalian / Change</Text>
                <Text style={s.changeValue}>{formatPrice(change)}</Text>
              </View>
            )}
          </>
        )}

        {/* Footer */}
        <View style={s.divider} />
        <View style={s.footer}>
          <Text style={s.footerText}>Terima kasih telah berkunjung</Text>
          <Text style={s.footerText}>Thank you for dining with us</Text>
          <Text style={s.footerAr}>شكراً لزيارتكم</Text>
          <Text style={{ ...s.footerText, marginTop: 4, fontSize: 6.5 }}>
            **** Struk ini adalah bukti pembayaran ****
          </Text>
        </View>

      </Page>
    </Document>
  )
}

interface DownloadButtonProps {
  data: PDFReceiptProps
  orderNumber?: string
}

export function PDFDownloadButton({ data, orderNumber }: DownloadButtonProps) {
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : undefined
  const filename = `struk-${orderNumber || data.tableNumber}-${Date.now()}.pdf`

  return (
    <PDFDownloadLink document={<ReceiptDocument data={data} logoUrl={logoUrl} />} fileName={filename}>
      {({ loading }) => (
        <button
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm disabled:opacity-50 transition-opacity"
          style={{ background: '#1A1208', color: 'white' }}
        >
          <Download size={14} />
          {loading ? 'Menyiapkan...' : 'Download PDF'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
