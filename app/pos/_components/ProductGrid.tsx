'use client'
import { useMemo } from 'react'
import { MenuItem } from '@/types'
import { usePOSStore } from '@/stores/pos.store'
import ProductCard from './ProductCard'

interface Props {
  menu: MenuItem[]
}

export default function ProductGrid({ menu }: Props) {
  const searchQuery = usePOSStore(s => s.searchQuery)
  const selectedCategory = usePOSStore(s => s.selectedCategory)

  const filtered = useMemo(() => {
    let result = menu
    if (selectedCategory) result = result.filter(m => m.category === selectedCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(m =>
        m.name_id.toLowerCase().includes(q) ||
        m.name_en.toLowerCase().includes(q) ||
        (m.name_ar ?? '').includes(q)
      )
    }
    // Promo di atas
    return [...result].sort((a, b) => {
      if ((b.discount_percent ?? 0) !== (a.discount_percent ?? 0))
        return (b.discount_percent ?? 0) - (a.discount_percent ?? 0)
      if (b.is_best_seller !== a.is_best_seller) return b.is_best_seller ? 1 : -1
      return 0
    })
  }, [menu, searchQuery, selectedCategory])

  if (!filtered.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Tidak ada menu ditemukan
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="grid grid-cols-3 gap-2.5 xl:grid-cols-4">
        {filtered.map(item => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
