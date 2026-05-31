'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MenuItem } from '@/types'
import { supabase } from '@/lib/supabase'
const RESTAURANT_ID_POS = process.env.NEXT_PUBLIC_RESTAURANT_ID!
import { MOCK_MENU, IS_MOCK_MODE } from '@/lib/mock-data'
import { usePOSStore } from '@/stores/pos.store'

import POSHeader from './_components/POSHeader'
import CloudIntegrationsBanner from './_components/CloudIntegrationsBanner'
import SearchBar from './_components/SearchBar'
import CategoryTabs from './_components/CategoryTabs'
import ProductGrid from './_components/ProductGrid'
import Cart from './_components/Cart'
import IncomingOrders from './_components/IncomingOrders'
import HungerStationOrders from './_components/HungerStationOrders'
import KeetaOrders from './_components/KeetaOrders'
import NewOrderAlert from './_components/NewOrderAlert'

function POSInner() {
  const searchParams = useSearchParams()
  const tableParam = searchParams.get('table') ?? '1'

  const setTable = usePOSStore(s => s.setTable)
  const tableNumber = usePOSStore(s => s.tableNumber)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [showIncoming, setShowIncoming] = useState(false)
  const [showHungerStation, setShowHungerStation] = useState(false)
  const [showKeeta, setShowKeeta] = useState(false)
  const [alertSound, setAlertSound] = useState(true)
  const [checkoutCount, setCheckoutCount] = useState(0)

  useEffect(() => {
    if (!tableNumber) setTable(tableParam)
  }, [tableParam, tableNumber, setTable])

  useEffect(() => {
    async function loadMenu() {
      setLoadingMenu(true)
      if (IS_MOCK_MODE) {
        setMenu(MOCK_MENU)
        setLoadingMenu(false)
        return
      }
      const { data } = await supabase
        .from('menu')
        .select('*')
        .eq('is_available', true)
        .order('category')
      setMenu((data as MenuItem[]) ?? [])
      setLoadingMenu(false)
    }
    loadMenu()
  }, [])

  // Ghost-order cleanup: run on mount + every 5 min
  useEffect(() => {
    function cleanup() {
      fetch('/api/cleanup/ghost-orders', { method: 'POST' }).catch(() => {})
    }
    cleanup()
    const id = setInterval(cleanup, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  // Realtime checkout queue counter — orders needing payment
  useEffect(() => {
    async function fetchCheckout() {
      const { count } = await supabase
        .from('orders').select('id', { count: 'exact', head: true })
        .eq('restaurant_id', RESTAURANT_ID_POS)
        .in('status', ['served', 'awaiting_payment'])
      setCheckoutCount(count ?? 0)
    }
    fetchCheckout()
    const ch = supabase.channel('pos-checkout-counter')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, fetchCheckout)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  // Open correct delivery panel by source
  function handleOpenDelivery(source: string) {
    if (source === 'keeta') setShowKeeta(true)
    else setShowHungerStation(true)
  }

  return (
    <div className="h-full flex font-inter" style={{ background: 'var(--pos-bg)' }}>
      {/* ── LEFT PANEL ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <POSHeader soundEnabled={alertSound} onToggleSound={() => setAlertSound(s => !s)} />
        <SearchBar />

        {/* Cloud API Integrations banner */}
        <CloudIntegrationsBanner
          onOpenQR={() => setShowIncoming(true)}
          onOpenDelivery={handleOpenDelivery}
        />

        {/* Checkout queue alert — orders served/awaiting payment */}
        {checkoutCount > 0 && (
          <button
            onClick={() => setShowIncoming(true)}
            className="flex items-center justify-between px-5 py-2.5 flex-shrink-0 w-full text-left"
            style={{ background: '#EF444415', borderBottom: '1px solid #EF444430' }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-black text-red-500">
                {checkoutCount} pesanan menunggu bayar
              </span>
            </div>
            <span className="text-[10px] font-bold text-red-400">Checkout →</span>
          </button>
        )}

        {!loadingMenu && <CategoryTabs menu={menu} />}

        {loadingMenu ? (
          <div className="flex-1 flex items-center justify-center">
            <div
              className="w-8 h-8 rounded-full border-[3px] border-gray-200 animate-spin"
              style={{ borderTopColor: '#FF6B35' }}
            />
          </div>
        ) : (
          <ProductGrid menu={menu} />
        )}
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        className="w-[360px] xl:w-[400px] flex-shrink-0 flex flex-col bg-white"
        style={{ borderLeft: '1px solid #F0EAE0', boxShadow: '-4px 0 24px rgba(0,0,0,0.04)' }}
      >
        <Cart tableParam={tableParam} />
      </div>

      {/* ── Drawers ── */}
      <IncomingOrders
        open={showIncoming}
        onClose={() => setShowIncoming(false)}
        onOrderLoaded={() => setShowIncoming(false)}
      />
      <HungerStationOrders
        open={showHungerStation}
        onClose={() => setShowHungerStation(false)}
      />
      <KeetaOrders
        open={showKeeta}
        onClose={() => setShowKeeta(false)}
      />

      {/* Realtime new-order alert banner + sound */}
      <NewOrderAlert
        soundEnabled={alertSound}
        onOpenQR={() => setShowIncoming(true)}
        onOpenDelivery={handleOpenDelivery}
      />
    </div>
  )
}

export default function POSPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-[#F5F2EE]">
          <div
            className="w-10 h-10 rounded-full border-4 border-gray-200 animate-spin"
            style={{ borderTopColor: '#FF6B35' }}
          />
        </div>
      }
    >
      <POSInner />
    </Suspense>
  )
}
