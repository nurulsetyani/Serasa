'use client'

import { OrderStatus } from '@/types'
import { useLang } from '@/context/LanguageContext'
import { TranslationKey } from '@/lib/i18n'

const STATUS_CONFIG: Record<OrderStatus, { icon: string; className: string; labelKey: TranslationKey }> = {
  pending:   { icon: '⏳', className: 'status-pending',   labelKey: 'pending' },
  cooking:   { icon: '🔥', className: 'status-cooking',   labelKey: 'cooking' },
  ready:     { icon: '✅', className: 'status-ready',     labelKey: 'ready' },
  delivered: { icon: '🎉', className: 'status-delivered', labelKey: 'delivered' },
}

interface Props {
  status: OrderStatus
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const { t } = useLang()
  const cfg = STATUS_CONFIG[status]

  const sizeClass = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  }[size]

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${cfg.className} ${sizeClass}`}>
      <span>{cfg.icon}</span>
      <span>{t(cfg.labelKey)}</span>
    </span>
  )
}
