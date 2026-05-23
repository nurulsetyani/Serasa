'use client'
import { useEffect, useState } from 'react'
import { ModifierGroup } from '@/types/pos'
import { IS_MOCK_MODE } from '@/lib/mock-data'
import { supabase } from '@/lib/supabase'

// Mock modifier groups — dipakai saat IS_MOCK_MODE = true
const MOCK_MODIFIER_MAP: Record<string, ModifierGroup[]> = {
  'mock-1': [  // Mie Goreng Ayam
    {
      id: 'mg-spice', name_id: 'Tingkat Kepedasan', name_en: 'Spice Level', name_ar: 'مستوى الحرارة',
      type: 'single', required: true, min_select: 1, max_select: 1,
      modifiers: [
        { id: 'ms-1', groupId: 'mg-spice', name_id: 'Tidak Pedas', name_en: 'Not Spicy', price_adjustment: 0, is_available: true },
        { id: 'ms-2', groupId: 'mg-spice', name_id: 'Pedas Sedang', name_en: 'Medium Spicy', price_adjustment: 0, is_available: true },
        { id: 'ms-3', groupId: 'mg-spice', name_id: 'Pedas Ekstra', name_en: 'Extra Spicy', price_adjustment: 0, is_available: true },
      ],
    },
    {
      id: 'mg-addon', name_id: 'Tambahan', name_en: 'Add-ons', name_ar: 'إضافات',
      type: 'multiple', required: false, min_select: 0, max_select: 3,
      modifiers: [
        { id: 'ma-1', groupId: 'mg-addon', name_id: 'Telur Ceplok', name_en: 'Fried Egg', price_adjustment: 4, is_available: true },
        { id: 'ma-2', groupId: 'mg-addon', name_id: 'Extra Ayam', name_en: 'Extra Chicken', price_adjustment: 8, is_available: true },
        { id: 'ma-3', groupId: 'mg-addon', name_id: 'Kerupuk', name_en: 'Crackers', price_adjustment: 2, is_available: true },
      ],
    },
  ],
  'mock-3': [  // Nasi Goreng Spesial
    {
      id: 'mg-spice2', name_id: 'Tingkat Kepedasan', name_en: 'Spice Level', name_ar: 'مستوى الحرارة',
      type: 'single', required: true, min_select: 1, max_select: 1,
      modifiers: [
        { id: 'ms2-1', groupId: 'mg-spice2', name_id: 'Tidak Pedas', name_en: 'Not Spicy', price_adjustment: 0, is_available: true },
        { id: 'ms2-2', groupId: 'mg-spice2', name_id: 'Pedas Sedang', name_en: 'Medium', price_adjustment: 0, is_available: true },
        { id: 'ms2-3', groupId: 'mg-spice2', name_id: 'Pedas Banget', name_en: 'Very Spicy', price_adjustment: 0, is_available: true },
      ],
    },
    {
      id: 'mg-egg', name_id: 'Pilihan Telur', name_en: 'Egg Style', name_ar: 'نوع البيض',
      type: 'single', required: false, min_select: 0, max_select: 1,
      modifiers: [
        { id: 'me-1', groupId: 'mg-egg', name_id: 'Telur Ceplok', name_en: 'Fried Egg', price_adjustment: 0, is_available: true },
        { id: 'me-2', groupId: 'mg-egg', name_id: 'Telur Dadar', name_en: 'Omelette', price_adjustment: 0, is_available: true },
        { id: 'me-3', groupId: 'mg-egg', name_id: 'Tanpa Telur', name_en: 'No Egg', price_adjustment: -2, is_available: true },
      ],
    },
  ],
  'mock-6': [  // Sate Ayam
    {
      id: 'mg-portion', name_id: 'Porsi', name_en: 'Portion', name_ar: 'الحصة',
      type: 'single', required: true, min_select: 1, max_select: 1,
      modifiers: [
        { id: 'mp-1', groupId: 'mg-portion', name_id: '5 Tusuk', name_en: '5 Skewers', price_adjustment: 0, is_available: true },
        { id: 'mp-2', groupId: 'mg-portion', name_id: '10 Tusuk', name_en: '10 Skewers', price_adjustment: 14, is_available: true },
      ],
    },
    {
      id: 'mg-sauce', name_id: 'Saus', name_en: 'Sauce', name_ar: 'الصلصة',
      type: 'multiple', required: false, min_select: 0, max_select: 2,
      modifiers: [
        { id: 'msc-1', groupId: 'mg-sauce', name_id: 'Kecap Manis', name_en: 'Sweet Soy', price_adjustment: 0, is_available: true },
        { id: 'msc-2', groupId: 'mg-sauce', name_id: 'Saus Kacang Extra', name_en: 'Extra Peanut', price_adjustment: 3, is_available: true },
      ],
    },
  ],
}

export function useModifiers(menuId: string) {
  const [groups, setGroups] = useState<ModifierGroup[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!menuId) return
    setLoading(true)

    if (IS_MOCK_MODE) {
      setGroups(MOCK_MODIFIER_MAP[menuId] ?? [])
      setLoading(false)
      return
    }

    async function fetch() {
      try {
        const { data } = await supabase
          .from('menu_modifier_groups')
          .select(`
            group_id,
            modifier_groups (
              id, name_id, name_en, name_ar, type, required, min_select, max_select,
              modifiers ( id, name_id, name_en, name_ar, price_adjustment, is_available, sort_order )
            )
          `)
          .eq('menu_id', menuId)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: ModifierGroup[] = (data ?? []).reduce((acc: ModifierGroup[], row: any) => {
          const g = row.modifier_groups
          if (!g) return acc
          const group: ModifierGroup = {
            id: g.id, name_id: g.name_id, name_en: g.name_en, name_ar: g.name_ar,
            type: g.type, required: g.required, min_select: g.min_select, max_select: g.max_select,
            modifiers: (g.modifiers ?? []).sort((a: { sort_order?: number }, b: { sort_order?: number }) =>
              (a.sort_order ?? 0) - (b.sort_order ?? 0)),
          }
          acc.push(group)
          return acc
        }, [])

        setGroups(result)
      } catch {
        setGroups([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [menuId])

  const hasModifiers = groups.length > 0
  return { groups, loading, hasModifiers }
}
