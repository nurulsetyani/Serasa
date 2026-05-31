// ZATCA (Saudi Tax Authority) e-invoice QR code generator
// Specification: Phase 1 Simplified Tax Invoice
// Format: TLV (Tag-Length-Value) encoded as Base64
//
// Required env vars (add to Vercel + .env.local):
//   NEXT_PUBLIC_SELLER_NAME   = Serasa Indonesian Restaurant
//   NEXT_PUBLIC_VAT_NUMBER    = 300000000000003  (15-digit VAT number from ZATCA portal)
//   NEXT_PUBLIC_VAT_PERCENT   = 15 (default 15%)

export interface ZATCAParams {
  sellerName:   string
  vatNumber:    string
  invoiceDate:  string   // ISO 8601: "2025-05-31T14:30:00Z"
  totalWithVAT: number   // grand total including VAT
  vatAmount:    number   // VAT amount only
}

/**
 * Generate ZATCA-compliant QR code string (Base64 TLV)
 * Tags:
 *   1 = Seller name
 *   2 = VAT registration number
 *   3 = Invoice date/time (ISO 8601)
 *   4 = Invoice total (with VAT)
 *   5 = VAT amount
 */
export function generateZATCAQR(p: ZATCAParams): string {
  function tlv(tag: number, value: string): number[] {
    const bytes = Array.from(new TextEncoder().encode(value))
    return [tag, bytes.length, ...bytes]
  }

  const payload = [
    ...tlv(1, p.sellerName),
    ...tlv(2, p.vatNumber),
    ...tlv(3, p.invoiceDate),
    ...tlv(4, p.totalWithVAT.toFixed(2)),
    ...tlv(5, p.vatAmount.toFixed(2)),
  ]

  return btoa(String.fromCharCode(...payload))
}

/** Calculate VAT breakdown from VAT-inclusive total */
export function calcVAT(totalInclVAT: number, vatPercent = 15) {
  const subtotal  = totalInclVAT / (1 + vatPercent / 100)
  const vatAmount = totalInclVAT - subtotal
  return {
    subtotal:  Math.round(subtotal  * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total:     totalInclVAT,
    vatPercent,
  }
}

/** Build ZATCA QR from order data using env vars */
export function buildOrderZATCAQR(order: {
  total_price: number
  created_at: string
}): string {
  const sellerName = process.env.NEXT_PUBLIC_SELLER_NAME ?? 'Serasa Restaurant'
  const vatNumber  = process.env.NEXT_PUBLIC_VAT_NUMBER  ?? '300000000000003'
  const vatPercent = Number(process.env.NEXT_PUBLIC_VAT_PERCENT ?? 15)
  const { vatAmount } = calcVAT(order.total_price, vatPercent)

  return generateZATCAQR({
    sellerName,
    vatNumber,
    invoiceDate:  order.created_at,
    totalWithVAT: order.total_price,
    vatAmount,
  })
}
