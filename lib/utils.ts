import { CartItem, OrderStatus } from '@/types'

export function formatPrice(price: number): string {
  return `${price.toLocaleString()} SR`
}

export function calculateCartTotal(items: CartItem[], discountPct = 0): {
  subtotal: number
  discount: number
  total: number
} {
  const subtotal = items.reduce((sum, item) => {
    const price = item.promo_price ?? item.price
    return sum + price * item.qty
  }, 0)
  const discount = Math.round(subtotal * (discountPct / 100))
  return { subtotal, discount, total: subtotal - discount }
}

export function calculateEstimatedTime(items: CartItem[], queueCount = 0): number {
  if (!items.length) return 0
  const maxCookTime = Math.max(...items.map(i => i.cook_time))
  const queueDelay = queueCount * 5
  return maxCookTime + queueDelay
}

export function getStatusStep(status: OrderStatus): number {
  const steps: OrderStatus[] = ['pending', 'cooking', 'ready', 'delivered']
  return steps.indexOf(status)
}

export function getTimeBasedPromo(): number {
  const hour = new Date().getHours()
  // Lunch promo: 11:00–14:00 → 10% off
  if (hour >= 11 && hour < 14) return 10
  // Dinner promo: 18:00–20:00 → 5% off
  if (hour >= 18 && hour < 20) return 5
  return 0
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
