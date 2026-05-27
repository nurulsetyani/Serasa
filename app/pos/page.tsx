'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MenuItem } from '@/types'
import { supabase } from '@/lib/supabase'
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

  // "Delivery Apps" button opens HS first; if none pending, opens Keeta
  function handleOpenDelivery() {
    setShowHungerStation(true)
  }

  return (
    <div className="h-full flex font-inter" style={{ background: 'var(--pos-bg)' }}>
      {/* ── LEFT PANEL ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <POSHeader />
        <SearchBar />

        {/* Cloud API Integrations banner */}
        <CloudIntegrationsBanner
          onOpenQR={() => setShowIncoming(true)}
          onOpenDelivery={handleOpenDelivery}
        />

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
