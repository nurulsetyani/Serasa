'use client'
import { Search, X } from 'lucide-react'
import { usePOSStore } from '@/stores/pos.store'
import { useEffect, useRef } from 'react'

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
    <div className="px-4 py-2.5 bg-white flex-shrink-0" style={{ borderBottom: '1px solid var(--pos-border)' }}>
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={searchQuery}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search menu / ابحث في القائمة... (F1)"
          className="w-full pl-9 pr-8 py-2.5 rounded-xl text-[13px] font-inter text-gray-800 outline-none placeholder:text-gray-400"
          style={{
            background: 'var(--pos-bg)',
            border: '1.5px solid var(--pos-border)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = `${P}80`
            e.currentTarget.style.boxShadow = `0 0 0 3px ${P}18`
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--pos-border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
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
