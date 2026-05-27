'use client'
import { usePOSStore } from '@/stores/pos.store'
import { MenuItem } from '@/types'
import { useRef, useEffect } from 'react'

const P = '#FF6B35'

// Arabic translations for known category slugs
const CAT_AR: Record<string, string> = {
  'noodles':    'المعكرونة',
  'rice':       'الأرز',
  'grills':     'المشويات',
  'sides':      'الأطباق الجانبية',
  'snacks':     'الوجبات الخفيفة',
  'beverages':  'المشروبات',
  'drinks':     'المشروبات',
  'desserts':   'الحلويات',
  'soups':      'الشوربات',
  'salads':     'السلطات',
  'burgers':    'البرجر',
  'sandwiches': 'الشطائر',
  'seafood':    'المأكولات البحرية',
  'chicken':    'الدجاج',
  'lamb':       'الضأن',
  'beef':       'اللحم',
  'pizza':      'البيتزا',
  'pasta':      'المعكرونة',
  'special':    'أطباق خاصة',
  'breakfast':  'الإفطار',
}

interface Props {
  menu: MenuItem[]
}

export default function CategoryTabs({ menu }: Props) {
  const selectedCategory = usePOSStore(s => s.selectedCategory)
  const setCategory = usePOSStore(s => s.setCategory)
  const scrollRef = useRef<HTMLDivElement>(null)

  const categories = ['Semua', ...Array.from(new Set(menu.map(m => m.category).filter(Boolean)))]

  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-active="true"]') as HTMLElement
    el?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [selectedCategory])

  function getArLabel(cat: string): string {
    const key = cat.toLowerCase()
    return CAT_AR[key] || ''
  }

  function getEnLabel(cat: string): string {
    if (cat === 'Semua') return 'All Menu'
    return cat.charAt(0).toUpperCase() + cat.slice(1)
  }

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 px-4 py-3 overflow-x-auto bg-white flex-shrink-0"
      style={{ borderBottom: '1px solid var(--pos-border)', scrollbarWidth: 'none' }}
    >
      {categories.map(cat => {
        const active = cat === 'Semua' ? selectedCategory === null : selectedCategory === cat
        const count = cat === 'Semua'
          ? menu.length
          : menu.filter(m => m.category === cat).length
        const enLabel = getEnLabel(cat)
        const arLabel = cat === 'Semua' ? 'الكل' : getArLabel(cat)

        return (
          <button
            key={cat}
            data-active={active}
            onClick={() => setCategory(cat === 'Semua' ? null : cat)}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap font-inter transition-[background-color,color,box-shadow] duration-150"
            style={{
              background: active ? P : 'var(--pos-bg)',
              color: active ? 'white' : 'var(--pos-muted)',
              boxShadow: active ? `var(--pos-shadow-brand)` : 'none',
              border: active ? 'none' : '1.5px solid var(--pos-border)',
            }}
          >
            <span className="text-[12px] font-semibold">{enLabel}</span>
            {arLabel && (
              <span className="text-[10px] font-normal opacity-75">{arLabel}</span>
            )}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: active ? 'rgba(255,255,255,0.22)' : 'var(--pos-border)', color: active ? 'white' : 'var(--pos-muted)' }}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
