import { CartItem, OrderStatus } from '@/types'

export function formatPrice(price: number): string {
  return `${price.toLocaleString()} SR`
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
  const steps: OrderStatus[] = ['pending', 'cooking', 'ready', 'delivered']
  return steps.indexOf(status)
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
