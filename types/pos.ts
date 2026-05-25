export type OrderTypeV2 = 'dine_in' | 'take_away' | 'delivery'
export type DiscountType = 'percent' | 'fixed'
export type POSPaymentMethod = 'cash' | 'mada' | 'visa' | 'applepay' | 'qris' | 'transfer'

export interface POSModifier {
  id: string
  groupId: string
  name: string
  priceAdj: number
}

export interface POSLine {
  lineId: string
  menuId: string
  name: string
  name_ar?: string
  unitPrice: number
  modifiers: POSModifier[]
  qty: number
  note: string
  lineTotal: number
}

export interface POSPayment {
  method: POSPaymentMethod
  amount: number
  reference?: string
}

export interface ModifierOption {
  id: string
  groupId: string
  name_id: string
  name_en: string
  name_ar?: string
  price_adjustment: number
  is_available: boolean
}

export interface ModifierGroup {
  id: string
  name_id: string
  name_en: string
  name_ar?: string
  type: 'single' | 'multiple'
  required: boolean
  min_select: number
  max_select: number
  modifiers: ModifierOption[]
}
