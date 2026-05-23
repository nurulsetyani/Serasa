'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MenuItem } from '@/types'
import { supabase } from '@/lib/supabase'
import { MOCK_MENU, IS_MOCK_MODE } from '@/lib/mock-data'
import { usePOSStore } from '@/stores/pos.store'

import POSHeader from './_components/POSHeader'
import OrderTypeBar from './_components/OrderTypeBar'
import SearchBar from './_components/SearchBar'
import CategoryTabs from './_components/CategoryTabs'
import ProductGrid from './_components/ProductGrid'
import Cart from './_components/Cart'

// ── Inner component: boleh pakai useSearchParams karena dibungkus Suspense ──
function POSInner() {
  const searchParams = useSearchParams()
  const tableParam = searchParams.get('table') ?? '1'

  const setTable = usePOSStore(s => s.setTable)
  const tableNumber = usePOSStore(s => s.tableNumber)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loadingMenu, setLoadingMenu] = useState(true)

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

  return (
    <div className="h-full flex" style={{ background: '#F5F2EE' }}>
      {/* ── LEFT PANEL ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <POSHeader />
        <OrderTypeBar />
        <SearchBar />
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
    </div>
  )
}

// ── Page: Suspense wajib untuk useSearchParams di Next.js 14 ──
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
