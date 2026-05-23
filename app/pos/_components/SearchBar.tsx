'use client'
import { Search, X } from 'lucide-react'
import { usePOSStore } from '@/stores/pos.store'
import { useEffect, useRef, useState } from 'react'

const P = '#FF6B35'

export default function SearchBar() {
  const searchQuery = usePOSStore(s => s.searchQuery)
  const setSearch = usePOSStore(s => s.setSearch)
  const ref = useRef<HTMLInputElement>(null)

  // F1 = focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); ref.current?.focus() }
      if (e.key === 'Escape') { setSearch(''); ref.current?.blur() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setSearch])

  return (
    <div className="px-4 py-2 bg-white border-b border-gray-100 flex-shrink-0">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={ref}
          type="text"
          value={searchQuery}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari menu... (F1)"
          className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm text-gray-800 outline-none bg-[#F5F2EE] placeholder:text-gray-400"
          style={{ transition: 'box-shadow 0.15s' }}
          onFocus={e => (e.currentTarget.style.boxShadow = `0 0 0 2px ${P}40`)}
          onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
        />
        {searchQuery && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
