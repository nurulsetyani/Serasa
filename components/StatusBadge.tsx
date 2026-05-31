'use client'

import { OrderStatus } from '@/types'
import { useLang } from '@/context/LanguageContext'
import { TranslationKey } from '@/lib/i18n'

const STATUS_CONFIG: Record<OrderStatus, { icon: string; className: string; labelKey: TranslationKey }> = {
  // New flow
  new:              { icon: '🕐', className: 'status-pending',   labelKey: 'orderWaiting'   },
  accepted:         { icon: '👨‍🍳', className: 'status-pending',   labelKey: 'accepted'       },
  preparing:        { icon: '🔥', className: 'status-cooking',   labelKey: 'cooking'        },
  ready:            { icon: '✅', className: 'status-ready',     labelKey: 'ready'          },
  served:           { icon: '🍽️', className: 'status-ready',    labelKey: 'ready'          },
  awaiting_payment: { icon: '💳', className: 'status-pending',   labelKey: 'awaitingPayment'},
  paid:             { icon: '🎉', className: 'status-delivered', labelKey: 'delivered'      },
  // Legacy
  pending:          { icon: '⏳', className: 'status-pending',   labelKey: 'pending'        },
  cooking:          { icon: '🔥', className: 'status-cooking',   labelKey: 'cooking'        },
  delivered:        { icon: '🎉', className: 'status-delivered', labelKey: 'delivered'      },
  cancelled:        { icon: '❌', className: 'status-pending',   labelKey: 'pending'        },
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
