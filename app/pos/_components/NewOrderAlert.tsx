'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, QrCode, Bike } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!
const DISMISS_MS = 9000

interface AlertOrder {
  id: string
  source: string
  order_type: string
  table_number: string
  customer_name: string
  order_number: string
}

// ── Source config ─────────────────────────────
const SRC: Record<string, { label: string; color: string; dim: string }> = {
  qr:           { label: 'QR Menu',       color: '#FF6B35', dim: 'rgba(255,107,53,0.14)' },
  hungerstation:{ label: 'HungerStation', color: '#FF6000', dim: 'rgba(255,96,0,0.14)'  },
  keeta:        { label: 'Keeta',         color: '#00C851', dim: 'rgba(0,200,81,0.14)'  },
  pos:          { label: 'Kasir',         color: '#A78BFA', dim: 'rgba(167,139,250,0.14)'},
}

// ── Sound ─────────────────────────────────────
function playAlert(isDelivery: boolean) {
  try {
    const ctx = new AudioContext()
    // Delivery: 4-note urgent fanfare. QR: 3-note friendly chime.
    const seq = isDelivery
      ? [{ f: 392, t: 0, d: 0.10 }, { f: 523, t: 0.12, d: 0.10 },
         { f: 659, t: 0.24, d: 0.10 }, { f: 1047, t: 0.36, d: 0.24 }]
      : [{ f: 523, t: 0,    d: 0.12 }, { f: 659, t: 0.14, d: 0.12 },
         { f: 784, t: 0.28, d: 0.22 }]
    seq.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator()
      const g   = ctx.createGain()
      osc.connect(g); g.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = f
      const s = ctx.currentTime + t
      g.gain.setValueAtTime(0, s)
      g.gain.linearRampToValueAtTime(0.42, s + 0.01)
      g.gain.exponentialRampToValueAtTime(0.001, s + d)
      osc.start(s); osc.stop(s + d)
    })
  } catch {}
}

// ── Props ─────────────────────────────────────
interface Props {
  soundEnabled: boolean
  onOpenQR: () => void
  onOpenDelivery: (source: string) => void
}

// ── Component ─────────────────────────────────
export default function NewOrderAlert({ soundEnabled, onOpenQR, onOpenDelivery }: Props) {
  const [alerts, setAlerts] = useState<AlertOrder[]>([])
  const soundRef = useRef(soundEnabled)
  useEffect(() => { soundRef.current = soundEnabled }, [soundEnabled])

  const dismiss = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  useEffect(() => {
    const ch = supabase.channel('pos-alert-listener')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${RESTAURANT_ID}`,
      }, payload => {
        const o = payload.new as Record<string, unknown>
        if (o.status !== 'new') return

        if (soundRef.current) playAlert(o.order_type === 'delivery')

        const alert: AlertOrder = {
          id: String(o.id),
          source: String(o.source ?? 'qr'),
          order_type: String(o.order_type ?? 'dine_in'),
          table_number: String(o.table_number ?? '?'),
          customer_name: String(o.customer_name ?? ''),
          order_number: String(o.order_number ?? ''),
        }

        setAlerts(prev => [alert, ...prev].slice(0, 4))
        setTimeout(() => dismiss(alert.id), DISMISS_MS)
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [dismiss])

  function tap(a: AlertOrder) {
    if (a.source === 'qr') onOpenQR()
    else onOpenDelivery(a.source)
    dismiss(a.id)
  }

  return (
    <div
      className="fixed z-[300] flex flex-col gap-2.5 items-center pointer-events-none"
      style={{ top: 20, left: '50%', transform: 'translateX(-50%)', width: 420 }}
    >
      <AnimatePresence mode="popLayout">
        {alerts.map(a => {
          const cfg = SRC[a.source] ?? SRC.qr
          const isDelivery = a.order_type === 'delivery'

          return (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: -48, scale: 0.90 }}
              animate={{ opacity: 1, y: 0,   scale: 1    }}
              exit={{    opacity: 0, y: -24,  scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="w-full rounded-2xl overflow-hidden pointer-events-auto cursor-pointer"
              style={{
                background: '#130E08',
                border: `1px solid ${cfg.color}40`,
                boxShadow: `0 0 40px ${cfg.dim}, 0 12px 40px rgba(0,0,0,0.55)`,
              }}
              onClick={() => tap(a)}
            >
              {/* Countdown bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: DISMISS_MS / 1000, ease: 'linear' }}
                style={{
                  height: 3,
                  background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}AA)`,
                  transformOrigin: 'left',
                  boxShadow: `0 0 12px ${cfg.color}`,
                }}
              />

              <div className="flex items-center gap-3.5 px-4 py-3.5">
                {/* Source badge */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                  style={{ background: cfg.dim, color: cfg.color }}
                >
                  {a.source === 'qr'
                    ? <QrCode size={18} />
                    : a.source === 'hungerstation'
                      ? 'HS'
                      : a.source === 'keeta'
                        ? 'KT'
                        : <Bike size={18} />
                  }
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white font-black text-[13px] tracking-wide uppercase">
                      Pesanan Baru
                    </span>
                    <span
                      className="text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide"
                      style={{ background: cfg.dim, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs truncate">
                    {isDelivery
                      ? `Delivery — ${a.customer_name}`
                      : `Meja ${a.table_number} — ${a.customer_name}`}
                    {a.order_number && (
                      <span className="ml-1.5 font-mono text-gray-600">{a.order_number}</span>
                    )}
                  </p>
                </div>

                {/* Tap CTA */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-[11px] font-black uppercase tracking-wider"
                    style={{ color: cfg.color }}
                  >
                    Proses →
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); dismiss(a.id) }}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
