'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import {
  Volume2, VolumeX, RefreshCw, Maximize, Minimize, X, Bike,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Order, OrderStatus } from '@/types'
import { supabase } from '@/lib/supabase'
import { IS_MOCK_MODE } from '@/lib/mock-data'

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!

type KitchenOrder = Order & { delivery_address?: string | null; source?: string | null }

// ─────────────────────────────────────────────
// MOCK DATA — showcases all timer states
// ─────────────────────────────────────────────
const MOCK_ORDERS: KitchenOrder[] = [
  {
    id: 'd1', restaurant_id: RESTAURANT_ID, table_number: '3',
    customer_name: 'Ahmad', status: 'pending', total_price: 60,
    order_number: 'POS-930686', order_type: 'dine_in',
    created_at: new Date(Date.now() - 2 * 60000).toISOString(), source: 'pos',
    order_items: [
      { id: 'i1', order_id: 'd1', menu_id: 'm1', name: 'Mie Goreng Ayam', price: 25, qty: 2, notes: 'Tidak pedas' },
      { id: 'i2', order_id: 'd1', menu_id: 'm5', name: 'Es Cendol', price: 12, qty: 1 },
    ],
  },
  {
    id: 'd2', restaurant_id: RESTAURANT_ID, table_number: '–',
    customer_name: 'Fatimah', status: 'cooking', total_price: 57,
    order_number: 'HS-847291', order_type: 'delivery',
    created_at: new Date(Date.now() - 7 * 60000).toISOString(), source: 'hungerstation',
    delivery_address: 'King Fahd Road, Riyadh',
    order_items: [
      { id: 'i3', order_id: 'd2', menu_id: 'm3', name: 'Nasi Goreng Spesial', price: 22, qty: 1, notes: 'Extra sambal' },
      { id: 'i4', order_id: 'd2', menu_id: 'm6', name: 'Rendang Sapi', price: 35, qty: 1 },
    ],
  },
  {
    id: 'd5', restaurant_id: RESTAURANT_ID, table_number: '7',
    customer_name: 'Mohammed', status: 'cooking', total_price: 45,
    order_number: 'QR-221983', order_type: 'dine_in',
    created_at: new Date(Date.now() - 13 * 60000).toISOString(), source: 'qr',
    order_items: [
      { id: 'i9', order_id: 'd5', menu_id: 'm2', name: 'Soto Ayam', price: 20, qty: 1 },
      { id: 'i10', order_id: 'd5', menu_id: 'm4', name: 'Teh Manis', price: 8, qty: 2, notes: 'Dingin, tidak manis' },
    ],
  },
  {
    id: 'd3', restaurant_id: RESTAURANT_ID, table_number: '–',
    customer_name: 'Layla', status: 'ready', total_price: 82,
    order_number: 'KT-558293', order_type: 'delivery',
    created_at: new Date(Date.now() - 18 * 60000).toISOString(), source: 'keeta',
    delivery_address: 'Olaya Street, Riyadh',
    order_items: [
      { id: 'i7', order_id: 'd3', menu_id: 'm7', name: 'Nasi Padang Komplit', price: 45, qty: 1 },
      { id: 'i8', order_id: 'd3', menu_id: 'm8', name: 'Jus Alpukat', price: 15, qty: 2, notes: 'Tidak terlalu manis' },
    ],
  },
]

// ─────────────────────────────────────────────
// SOUND — pleasant ascending triad
// ─────────────────────────────────────────────
function playNewOrderSound() {
  try {
    const ctx = new AudioContext()
    const notes = [
      { f: 523.25, t: 0,    d: 0.14 },
      { f: 659.25, t: 0.15, d: 0.14 },
      { f: 783.99, t: 0.30, d: 0.22 },
    ]
    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = f
      const s = ctx.currentTime + t
      gain.gain.setValueAtTime(0, s)
      gain.gain.linearRampToValueAtTime(0.38, s + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, s + d)
      osc.start(s); osc.stop(s + d)
    })
  } catch {}
}

// ─────────────────────────────────────────────
// COLUMN CONFIG
// ─────────────────────────────────────────────
const COLS = [
  {
    status: 'pending' as OrderStatus,
    label: 'BARU',
    color: '#FF9F0A',
    dim: 'rgba(255,159,10,0.10)',
    border: 'rgba(255,159,10,0.28)',
    glow: 'rgba(255,159,10,0.22)',
    nextLabel: 'MULAI MASAK',
    nextStatus: 'cooking' as OrderStatus,
    btn: '#FF6B35',
    btnShadow: '255,107,53',
    btnText: '#000',
  },
  {
    status: 'cooking' as OrderStatus,
    label: 'MASAK',
    color: '#FF6B35',
    dim: 'rgba(255,107,53,0.10)',
    border: 'rgba(255,107,53,0.28)',
    glow: 'rgba(255,107,53,0.20)',
    nextLabel: 'SIAP SAJI',
    nextStatus: 'ready' as OrderStatus,
    btn: '#30D158',
    btnShadow: '48,209,88',
    btnText: '#000',
  },
  {
    status: 'ready' as OrderStatus,
    label: 'SIAP',
    color: '#30D158',
    dim: 'rgba(48,209,88,0.09)',
    border: 'rgba(48,209,88,0.26)',
    glow: 'rgba(48,209,88,0.18)',
    nextLabel: 'SELESAI',
    nextStatus: 'delivered' as OrderStatus,
    btn: '#A78BFA',
    btnShadow: '167,139,250',
    btnText: '#0A0A14',
  },
]

// ─────────────────────────────────────────────
// SOURCE CONFIG
// ─────────────────────────────────────────────
const SOURCE_CFG: Record<string, { label: string; bg: string; color: string }> = {
  hungerstation: { label: 'HungerStation', bg: 'rgba(255,96,0,0.14)', color: '#FF7020' },
  keeta:         { label: 'Keeta',         bg: 'rgba(0,200,81,0.14)',  color: '#00C851' },
  qr:            { label: 'QR Scan',       bg: 'rgba(255,107,53,0.14)', color: '#FF6B35' },
  pos:           { label: 'Kasir',         bg: 'rgba(167,139,250,0.14)', color: '#A78BFA' },
}

// ─────────────────────────────────────────────
// TIMER — realtime, 1-second updates, SLA colors
// ─────────────────────────────────────────────
function Timer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const calc = () => Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
    setElapsed(calc())
    const id = setInterval(() => setElapsed(calc()), 1000)
    return () => clearInterval(id)
  }, [createdAt])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const isUrgent = mins >= 10
  const isWarn   = mins >= 5 && mins < 10

  const color  = isUrgent ? '#FF453A' : isWarn ? '#FFD60A' : '#32D74B'
  const shadow = isUrgent ? '0 0 18px rgba(255,69,58,0.70)'
                : isWarn  ? '0 0 14px rgba(255,214,10,0.55)'
                :            '0 0 14px rgba(50,215,75,0.55)'

  return (
    <div
      className={isUrgent ? 'animate-pulse' : ''}
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontWeight: 800,
        fontSize: '2rem',
        lineHeight: 1,
        letterSpacing: '-0.03em',
        color,
        textShadow: shadow,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  )
}

// ─────────────────────────────────────────────
// LIVE CLOCK
// ─────────────────────────────────────────────
function LiveClock() {
  const [t, setT] = useState('')
  useEffect(() => {
    const up = () => setT(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    up(); const id = setInterval(up, 1000); return () => clearInterval(id)
  }, [])
  return (
    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '0.875rem', color: 'rgba(240,240,250,0.30)', letterSpacing: '0.05em' }}>
      {t}
    </span>
  )
}

// ─────────────────────────────────────────────
// BADGES
// ─────────────────────────────────────────────
function SourceBadge({ source }: { source?: string | null }) {
  const c = SOURCE_CFG[source ?? 'pos'] ?? SOURCE_CFG.pos
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: c.bg, color: c.color, border: `1px solid ${c.color}35`,
      borderRadius: 5, padding: '2px 8px',
      fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>
      {c.label}
    </span>
  )
}

function DeliveryBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'rgba(96,165,250,0.13)', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.25)',
      borderRadius: 5, padding: '2px 8px',
      fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>
      <Bike size={9} /> DELIVERY
    </span>
  )
}

function NoteChip({ text }: { text: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'rgba(255,107,53,0.13)', color: '#FF8C5A', border: '1px solid rgba(255,107,53,0.28)',
      borderRadius: 5, padding: '2px 8px',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      ⚑ {text.trim()}
    </span>
  )
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function KitchenPage() {
  const [orders, setOrders]     = useState<KitchenOrder[]>([])
  const [loading, setLoading]   = useState(true)
  const [advancing, setAdv]     = useState<string | null>(null)
  const [voiding, setVoid]      = useState<string | null>(null)
  const [soundOn, setSoundOn]   = useState(true)
  const [alertMsg, setAlertMsg] = useState<{ text: string; id: string } | null>(null)
  const [flashOn, setFlashOn]   = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const soundRef = useRef(true)
  useEffect(() => { soundRef.current = soundOn }, [soundOn])

  const fetchOrders = useCallback(async () => {
    if (IS_MOCK_MODE) { setOrders(MOCK_ORDERS); setLoading(false); return }
    const { data } = await supabase
      .from('orders').select('*, order_items(*)')
      .eq('restaurant_id', RESTAURANT_ID)
      .in('status', ['pending', 'cooking', 'ready'])
      .order('created_at', { ascending: true })
    if (data) setOrders(data as KitchenOrder[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    const ch = supabase.channel('kitchen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, p => {
        if (p.eventType === 'INSERT') {
          if (soundRef.current) playNewOrderSound()
          const o = p.new as KitchenOrder
          const where = o.order_type === 'delivery' ? 'DELIVERY' : `MEJA ${o.table_number}`
          setAlertMsg({ text: `PESANAN BARU — ${where}`, id: o.id })
          setFlashOn(true)
          setTimeout(() => setAlertMsg(null), 5000)
          setTimeout(() => setFlashOn(false), 700)
          fetchOrders()
        } else if (p.eventType === 'UPDATE') {
          const u = p.new as KitchenOrder
          if (u.status === 'delivered' || u.status === 'cancelled') {
            setOrders(prev => prev.filter(o => o.id !== u.id))
          } else {
            setOrders(prev => prev.map(o => o.id === u.id ? { ...o, ...u } : o))
          }
        }
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchOrders])

  async function advance(orderId: string, nextStatus: OrderStatus) {
    setAdv(orderId)
    await fetch(`/api/order/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    setAdv(null)
  }

  async function voidOrder(orderId: string, tableNum: string) {
    if (!confirm(`Void order Meja ${tableNum}? Tindakan ini tidak bisa dibatalkan.`)) return
    setVoid(orderId)
    await fetch(`/api/order/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    setVoid(null)
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setFullscreen(false)
    }
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length

  return (
    <>
      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@700;800&display=swap');

        .kds { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }

        .kds-flash {
          animation: kdsFlash 0.7s ease-out;
        }
        @keyframes kdsFlash {
          0%   { background-color: rgba(255,159,10,0.18); }
          100% { background-color: #08080F; }
        }

        .kds-card { transition: box-shadow 0.2s ease; }
        .kds-card:hover { box-shadow: 0 12px 48px rgba(0,0,0,0.7) !important; }

        .kds-btn { transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.12s ease; }
        .kds-btn:active { transform: scale(0.965) translateY(2px) !important; }
        .kds-btn:disabled { opacity: 0.45 !important; transform: none !important; }

        .kds-col { max-height: calc(100dvh - 120px); overflow-y: auto; }
        .kds-col::-webkit-scrollbar { width: 3px; }
        .kds-col::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

        /* Noise texture overlay */
        .kds-noise::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 128px;
          z-index: 9999;
        }
      `}</style>

      <div
        className={`kds kds-noise min-h-dvh flex flex-col ${flashOn ? 'kds-flash' : ''}`}
        style={{ background: '#08080F', color: '#F0F0FA' }}
      >
        {/* ━━━━━━━━━━━━━━ HEADER ━━━━━━━━━━━━━━ */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-5 h-[58px] flex-shrink-0"
          style={{
            background: 'rgba(8,8,15,0.94)',
            backdropFilter: 'blur(28px) saturate(160%)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Logo + title */}
          <div className="flex items-center gap-3.5">
            <div className="relative w-[88px] h-[30px]">
              <Image src="/logof22.png" alt="Serasa" fill className="object-contain object-left" sizes="88px" />
            </div>
            <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.10)' }} />
            <div>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800, fontSize: 14, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: '#F0F0FA', lineHeight: 1.1,
              }}>
                Kitchen Display
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#30D158', boxShadow: '0 0 8px rgba(48,209,88,0.8)', animation: 'pulse 2s infinite' }} />
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'rgba(240,240,250,0.38)' }}>
                  {orders.length} aktif
                </span>
                {pendingCount > 0 && (
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
                    fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                    background: 'rgba(255,159,10,0.18)', color: '#FF9F0A',
                    border: '1px solid rgba(255,159,10,0.35)',
                    borderRadius: 5, padding: '1px 8px',
                    animation: 'pulse 1.5s infinite',
                  }}>
                    {pendingCount} BARU
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Live indicator */}
          <div
            className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{
              background: 'rgba(48,209,88,0.09)',
              border: '1px solid rgba(48,209,88,0.22)',
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#30D158', boxShadow: '0 0 10px rgba(48,209,88,0.9)',
              animation: 'pulse 1.8s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900, fontSize: 12, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: '#30D158',
            }}>
              LIVE
            </span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[
              {
                icon: soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />,
                onClick: () => setSoundOn(s => !s),
                active: soundOn,
                activeColor: 'rgba(255,107,53,0.18)',
                activeBorder: 'rgba(255,107,53,0.28)',
                activeIcon: '#FF6B35',
              },
              {
                icon: <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />,
                onClick: fetchOrders,
                active: false,
              },
              {
                icon: fullscreen ? <Minimize size={15} /> : <Maximize size={15} />,
                onClick: toggleFullscreen,
                active: false,
              },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.onClick}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: btn.active ? btn.activeColor : 'rgba(255,255,255,0.05)',
                  color: btn.active ? btn.activeIcon : 'rgba(255,255,255,0.30)',
                  border: `1px solid ${btn.active ? btn.activeBorder : 'rgba(255,255,255,0.07)'}`,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                {btn.icon}
              </button>
            ))}
          </div>
        </header>

        {/* ━━━━━━━━━━━━━━ ALERT BANNER ━━━━━━━━━━━━━━ */}
        <AnimatePresence>
          {alertMsg && (
            <motion.div
              key={alertMsg.id}
              initial={{ opacity: 0, y: -20, scaleY: 0.8 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -16, scaleY: 0.9 }}
              transition={{ type: 'spring', stiffness: 440, damping: 30 }}
              style={{
                margin: '12px 16px 0',
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 20px',
                borderRadius: 16,
                background: 'rgba(255,159,10,0.11)',
                border: '1px solid rgba(255,159,10,0.42)',
                boxShadow: '0 0 40px rgba(255,159,10,0.16), inset 0 1px 0 rgba(255,159,10,0.22)',
              }}
            >
              <span style={{ fontSize: 24, animation: 'bounce 1s infinite' }}>🔔</span>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900, fontSize: 20,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: '#FF9F0A',
              }}>
                {alertMsg.text}
              </span>
              <button
                onClick={() => setAlertMsg(null)}
                style={{ marginLeft: 'auto', color: 'rgba(255,159,10,0.45)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ━━━━━━━━━━━━━━ CONTENT ━━━━━━━━━━━━━━ */}
        {loading ? (
          /* Skeleton */
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 12 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                borderRadius: 20, height: 260,
                background: '#0F0F1A',
                border: '1px solid rgba(255,255,255,0.05)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          /* Empty state */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '80px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 72, marginBottom: 20, opacity: 0.6 }}>✅</div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 40, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F0F0FA', marginBottom: 8 }}>
              SEMUA BERES
            </h2>
            <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: 'rgba(240,240,250,0.28)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Tidak ada pesanan aktif
            </p>
          </div>
        ) : (
          /* 3-column grid */
          <div style={{ padding: '16px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'start', flex: 1 }}>
            {COLS.map(col => {
              const colOrders = orders.filter(o => o.status === col.status)
              return (
                <div key={col.status} className="kds-col" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 80 }}>

                  {/* ── Column Header ── */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    borderRadius: 14, marginBottom: 4,
                    background: col.dim,
                    border: `1px solid ${col.border}`,
                  }}>
                    {/* Status accent bar */}
                    <div style={{
                      width: 6, height: 52, borderRadius: 4, flexShrink: 0,
                      background: col.color,
                      boxShadow: `0 0 20px ${col.color}, 0 0 44px ${col.glow}`,
                    }} />
                    <span style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 900, fontSize: 36,
                      letterSpacing: '0.14em', textTransform: 'uppercase',
                      color: col.color,
                      textShadow: `0 0 36px ${col.glow}`,
                      lineHeight: 1,
                    }}>
                      {col.label}
                    </span>
                    <span style={{
                      marginLeft: 'auto',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 36, height: 36, borderRadius: 10,
                      fontFamily: '"JetBrains Mono", monospace', fontWeight: 900, fontSize: 18,
                      color: col.color,
                    }}>
                      {colOrders.length}
                    </span>
                  </div>

                  {/* ── Empty Column ── */}
                  {colOrders.length === 0 ? (
                    <div style={{
                      borderRadius: 18, padding: '52px 0',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                      background: 'rgba(255,255,255,0.018)',
                      border: `1px dashed ${col.border}`,
                    }}>
                      <span style={{ fontSize: 24, opacity: 0.2 }}>
                        {col.status === 'pending' ? '📭' : col.status === 'cooking' ? '🍳' : '✅'}
                      </span>
                      <p style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 800, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: col.color, opacity: 0.35,
                      }}>
                        Kosong
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {colOrders.map(order => (
                        <motion.div
                          key={order.id}
                          layout
                          layoutId={order.id}
                          initial={{ opacity: 0, scale: 0.92, y: 28 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.88, y: -16 }}
                          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                          className="kds-card"
                          style={{
                            borderRadius: 20, overflow: 'hidden', position: 'relative',
                            background: '#0F0F1A',
                            border: `1px solid ${col.border}`,
                            boxShadow: `0 8px 36px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.025), inset 0 1px 0 rgba(255,255,255,0.04)`,
                          }}
                        >
                          {/* Top glow stripe */}
                          <div style={{
                            height: 3, background: col.color,
                            boxShadow: `0 0 18px ${col.color}, 0 0 40px ${col.glow}`,
                          }} />

                          {/* Inner radial glow overlay */}
                          <div style={{
                            position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 20,
                            background: `radial-gradient(ellipse 80% 50% at 5% 5%, ${col.dim} 0%, transparent 65%)`,
                          }} />

                          {/* ── CARD HEADER ── */}
                          <div style={{ position: 'relative', padding: '20px 20px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>

                              {/* Table number — DOMINANT */}
                              <div>
                                {order.order_type === 'dine_in' ? (
                                  <>
                                    <div style={{
                                      fontFamily: "'Barlow Condensed', sans-serif",
                                      fontWeight: 900, fontSize: '6.5rem', lineHeight: 0.82,
                                      letterSpacing: '-0.01em', color: '#FFFFFF',
                                      textShadow: `0 0 70px ${col.glow}, 0 2px 0 rgba(0,0,0,0.6)`,
                                    }}>
                                      {order.table_number}
                                    </div>
                                    <div style={{
                                      fontFamily: '"JetBrains Mono", monospace',
                                      fontWeight: 700, fontSize: 11, letterSpacing: '0.28em',
                                      textTransform: 'uppercase', color: col.color,
                                      opacity: 0.6, marginTop: 8,
                                    }}>
                                      MEJA
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div style={{
                                      fontFamily: "'Barlow Condensed', sans-serif",
                                      fontWeight: 900, fontSize: '2.8rem', lineHeight: 1,
                                      letterSpacing: '0.04em', color: '#FFFFFF',
                                      textShadow: `0 0 50px ${col.glow}`,
                                    }}>
                                      DELIVERY
                                    </div>
                                    <div style={{
                                      fontFamily: '"JetBrains Mono", monospace',
                                      fontWeight: 700, fontSize: 10, letterSpacing: '0.22em',
                                      textTransform: 'uppercase', color: col.color,
                                      opacity: 0.5, marginTop: 6,
                                    }}>
                                      {order.source?.toUpperCase() ?? 'ONLINE'}
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Timer + void button */}
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, paddingTop: 2 }}>
                                <Timer createdAt={order.created_at} />
                                {col.status === 'pending' && (
                                  <button
                                    onClick={() => voidOrder(order.id, order.table_number)}
                                    disabled={voiding === order.id}
                                    style={{
                                      width: 28, height: 28, borderRadius: 8,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      background: 'rgba(255,69,58,0.13)', color: '#FF453A',
                                      border: '1px solid rgba(255,69,58,0.25)',
                                      cursor: 'pointer', transition: 'all 0.15s ease',
                                    }}
                                    title="Void order"
                                  >
                                    {voiding === order.id ? <span style={{ fontSize: 9 }}>…</span> : <X size={12} />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Customer + order number */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,240,250,0.38)' }}>
                                {order.customer_name}
                              </span>
                              {order.order_number && (
                                <>
                                  <span style={{ color: 'rgba(240,240,250,0.15)' }}>·</span>
                                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'rgba(240,240,250,0.20)' }}>
                                    {order.order_number}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Badges */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                              <SourceBadge source={order.source} />
                              {order.order_type === 'delivery' && <DeliveryBadge />}
                            </div>

                            {/* Delivery address */}
                            {order.order_type === 'delivery' && order.delivery_address && (
                              <div style={{
                                display: 'flex', alignItems: 'flex-start', gap: 8,
                                marginTop: 10, padding: '8px 12px', borderRadius: 12,
                                background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.18)',
                              }}>
                                <span style={{ color: '#60A5FA', fontSize: 12, flexShrink: 0, marginTop: 1 }}>📍</span>
                                <p style={{ fontSize: 11, color: '#93C5FD', fontWeight: 600, lineHeight: 1.4, margin: 0 }}>
                                  {order.delivery_address}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Divider */}
                          <div style={{ margin: '0 20px', height: 1, background: 'rgba(255,255,255,0.055)' }} />

                          {/* ── ITEMS ── */}
                          <div style={{ padding: '14px 20px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {order.order_items?.map(item => (
                              <div key={item.id} style={{ display: 'flex', gap: 12 }}>
                                {/* Qty */}
                                <span style={{
                                  fontFamily: "'Barlow Condensed', sans-serif",
                                  fontWeight: 900, fontSize: '1.7rem', lineHeight: 1.1,
                                  width: 44, textAlign: 'center', flexShrink: 0,
                                  color: col.color,
                                  textShadow: `0 0 12px ${col.glow}`,
                                }}>
                                  {item.qty}×
                                </span>
                                {/* Name + notes */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(240,240,250,0.92)', lineHeight: 1.3 }}>
                                    {item.name}
                                  </div>
                                  {item.notes && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                      {item.notes.split(',').map((n, i) => (
                                        <NoteChip key={i} text={n} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* ── ACTION BUTTON ── */}
                          <div style={{ padding: '2px 14px 16px' }}>
                            <motion.button
                              className="kds-btn"
                              whileTap={{ scale: 0.965 }}
                              onClick={() => advance(order.id, col.nextStatus)}
                              disabled={advancing === order.id}
                              style={{
                                width: '100%',
                                padding: '17px 0',
                                borderRadius: 14,
                                fontFamily: "'Barlow Condensed', sans-serif",
                                fontWeight: 900, fontSize: '1.35rem',
                                letterSpacing: '0.12em', textTransform: 'uppercase',
                                color: col.btnText,
                                background: col.btn,
                                border: 'none', cursor: 'pointer',
                                boxShadow: `0 0 32px rgba(${col.btnShadow},0.55), 0 6px 24px rgba(0,0,0,0.55)`,
                              }}
                            >
                              {advancing === order.id ? (
                                <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span>
                              ) : col.nextLabel}
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━ STATUS BAR ━━━━━━━━━━━━━━ */}
        <footer
          className="sticky bottom-0 flex-shrink-0 flex items-center justify-between px-5 h-10"
          style={{
            background: 'rgba(8,8,15,0.95)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(240,240,250,0.22)' }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {COLS.map(col => {
              const count = orders.filter(o => o.status === col.status).length
              return (
                <div key={col.status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: col.color }} />
                  <span style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 800, fontSize: 11,
                    color: col.color, letterSpacing: '0.06em',
                  }}>
                    {col.label} {count}
                  </span>
                </div>
              )
            })}
          </div>

          <LiveClock />
        </footer>
      </div>
    </>
  )
}
