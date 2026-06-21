import { CartItem, OrderStatus } from '@/types'

export function formatPrice(price: number): string {
  return `SAR ${price.toFixed(2)}`
}

export function discountedPrice(price: number, discountPercent?: number): number {
  if (!discountPercent || discountPercent <= 0) return price
  return Math.round(price * (1 - discountPercent / 100))
}

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const price = discountedPrice(item.price, item.discount_percent)
    return sum + price * item.qty
  }, 0)
}

export function calculateEstimatedTime(items: CartItem[], queueCount = 0): number {
  if (!items.length) return 0
  const maxCookTime = Math.max(...items.map(i => i.cook_time))
  return maxCookTime + queueCount * 5
}

export function getStatusStep(status: OrderStatus): number {
  // New flow
  const newSteps: OrderStatus[] = ['new', 'accepted', 'preparing', 'ready', 'served', 'awaiting_payment', 'paid']
  const ni = newSteps.indexOf(status)
  if (ni !== -1) return ni
  // Legacy flow mapping
  const legacyMap: Partial<Record<OrderStatus, number>> = {
    pending: 1, cooking: 2, delivered: 6, cancelled: -1,
  }
  return legacyMap[status] ?? 0
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
