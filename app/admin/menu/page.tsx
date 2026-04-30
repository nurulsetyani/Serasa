'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Plus, Pencil, Trash2, X, Check, ArrowLeft,
  Upload, Clock, Loader2, Flame, Star,
  UtensilsCrossed, Eye, EyeOff,
} from 'lucide-react'
import { MenuItem } from '@/types'
import { supabase } from '@/lib/supabase'

// ── Design tokens ─────────────────────────────────────────────
const C = {
  bg:     '#0F1115',
  card:   '#171A21',
  cardHv: '#1C1F26',
  border: '#23262F',
  accent: '#F5B041',
  text:   '#FFFFFF',
  muted:  '#A1A1AA',
  danger: '#EF4444',
}

// ── Categories ────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'all',        label: 'Semua',      icon: '✦'  },
  { key: 'signature',  label: 'Signature',  icon: '⭐' },
  { key: 'mix_rice',   label: 'Mix Rice',   icon: '🍱' },
  { key: 'fried_rice', label: 'Fried Rice', icon: '🍳' },
  { key: 'noodles',    label: 'Noodles',    icon: '🍜' },
  { key: 'satay',      label: 'Satay',      icon: '🍢' },
  { key: 'appetizer',  label: 'Appetizer',  icon: '🥗' },
  { key: 'meat',       label: 'Meat',       icon: '🥩' },
  { key: 'chicken',    label: 'Chicken',    icon: '🍗' },
  { key: 'bebek',      label: 'Bebek',      icon: '🦆' },
  { key: 'rice_bowl',  label: 'Rice Bowl',  icon: '🍚' },
  { key: 'seafood',    label: 'Seafood',    icon: '🦐' },
  { key: 'soup',       label: 'Soup',       icon: '🍲' },
  { key: 'extra',      label: 'Extra',      icon: '➕' },
  { key: 'drinks',     label: 'Drinks',     icon: '🥤' },
]

const EMPTY_FORM = {
  name_id: '', name_en: '', name_ar: '',
  description_id: '', description_en: '', description_ar: '',
  price: '', cook_time: '15', calories: '', category: 'signature',
  image: '', is_best_seller: false, is_available: true,
}

type FormData = typeof EMPTY_FORM

// ── Sub-components ─────────────────────────────────────────────
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl animate-fade-in"
      style={{ background: ok ? '#22C55E' : C.danger, color: '#fff' }}>
      {ok ? <Check size={15} /> : <X size={15} />}
      {msg}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border overflow-hidden animate-pulse" style={{ background: C.card, borderColor: C.border }}>
      <div className="aspect-square" style={{ background: C.cardHv }} />
      <div className="p-4 space-y-3">
        <div className="h-4 rounded" style={{ background: C.cardHv, width: '70%' }} />
        <div className="h-3 rounded" style={{ background: C.cardHv, width: '45%' }} />
        <div className="h-4 rounded" style={{ background: C.cardHv, width: '30%' }} />
        <div className="flex gap-2 pt-1">
          <div className="h-8 rounded-lg flex-1" style={{ background: C.cardHv }} />
          <div className="h-8 w-9 rounded-lg" style={{ background: C.cardHv }} />
        </div>
      </div>
    </div>
  )
}

function MenuCard({
  item, onEdit, onDelete, deleting,
}: {
  item: MenuItem
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const catLabel = CATEGORIES.find(c => c.key === item.category)

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-xl cursor-pointer group"
      style={{ background: C.card, borderColor: C.border }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden" style={{ background: C.cardHv }}>
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name_id}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: C.muted }}>
            <UtensilsCrossed size={40} />
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {item.is_best_seller && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg shadow"
              style={{ background: C.accent, color: '#000' }}>
              <Star size={9} fill="currentColor" /> Best Seller
            </span>
          )}
          {!item.is_available && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
              style={{ background: C.danger, color: '#fff' }}>
              Nonaktif
            </span>
          )}
        </div>

        {/* Category chip */}
        <div className="absolute bottom-2 right-2">
          <span className="text-[10px] font-medium px-2 py-1 rounded-lg backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.6)', color: C.muted }}>
            {catLabel?.icon} {catLabel?.label ?? item.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <h3 className="font-semibold text-base leading-snug mb-1 line-clamp-1" style={{ color: C.text }}>
          {item.name_id}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }}>
            <Clock size={11} />
            {item.cook_time}m
          </span>
          {item.calories && (
            <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }}>
              <Flame size={11} />
              {item.calories} kcal
            </span>
          )}
          {item.name_en && item.name_en !== item.name_id && (
            <span className="text-xs truncate" style={{ color: C.muted }}>{item.name_en}</span>
          )}
        </div>

        {/* Price */}
        <p className="text-lg font-bold mb-4" style={{ color: C.accent }}>
          {item.price} <span className="text-sm font-medium">SR</span>
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all duration-150 hover:opacity-90 active:scale-95"
            style={{ background: C.cardHv, color: C.text, border: `1px solid ${C.border}` }}
          >
            <Pencil size={13} />
            Edit
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="flex items-center justify-center w-9 py-2 rounded-lg transition-all duration-150 active:scale-95"
            style={{ color: C.danger, background: 'transparent', border: `1px solid ${C.border}` }}
            onMouseEnter={e => (e.currentTarget.style.background = `${C.danger}15`)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function MenuManagerPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<MenuItem | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [imgPreviewError, setImgPreviewError] = useState(false)

  useEffect(() => { fetchMenu() }, [])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function fetchMenu() {
    setLoading(true)
    const res = await fetch('/api/menu')
    if (res.ok) setMenu(await res.json())
    setLoading(false)
  }

  function openAdd() {
    setEditItem(null); setForm(EMPTY_FORM); setImgPreviewError(false); setShowForm(true)
  }

  function openEdit(item: MenuItem) {
    setEditItem(item)
    setForm({
      name_id: item.name_id, name_en: item.name_en, name_ar: item.name_ar,
      description_id: item.description_id ?? '', description_en: item.description_en ?? '', description_ar: item.description_ar ?? '',
      price: String(item.price), cook_time: String(item.cook_time),
      calories: item.calories ? String(item.calories) : '',
      category: item.category, image: item.image ?? '',
      is_best_seller: item.is_best_seller, is_available: item.is_available ?? true,
    })
    setImgPreviewError(false); setShowForm(true)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const name = `menu-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('menu-images').upload(name, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('menu-images').getPublicUrl(name)
      setForm(f => ({ ...f, image: publicUrl })); setImgPreviewError(false)
      showToast('Foto berhasil diupload!')
    } catch { showToast('Gagal upload. Coba paste URL.', false) }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSave() {
    if (!form.name_id.trim() || !form.price) { showToast('Nama & harga wajib diisi', false); return }
    setSaving(true)
    const payload = {
      name_id: form.name_id.trim(), name_en: form.name_en.trim() || form.name_id.trim(), name_ar: form.name_ar.trim() || form.name_id.trim(),
      description_id: form.description_id.trim() || null, description_en: form.description_en.trim() || null, description_ar: form.description_ar.trim() || null,
      price: parseFloat(form.price), cook_time: parseInt(form.cook_time) || 15,
      calories: form.calories ? parseInt(form.calories) : null,
      category: form.category, image: form.image.trim() || null,
      is_best_seller: form.is_best_seller, is_available: form.is_available,
    }
    const res = await fetch(editItem ? `/api/menu/${editItem.id}` : '/api/menu', {
      method: editItem ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) { showToast(editItem ? 'Menu diperbarui!' : 'Menu ditambahkan!'); setShowForm(false); fetchMenu() }
    else { const err = await res.json(); showToast(err.error ?? 'Gagal menyimpan', false) }
    setSaving(false)
  }

  async function handleDelete(item: MenuItem) {
    setDeleting(item.id)
    const res = await fetch(`/api/menu/${item.id}`, { method: 'DELETE' })
    if (res.ok) { showToast('Menu dihapus!'); setMenu(prev => prev.filter(m => m.id !== item.id)) }
    else { showToast('Gagal menghapus', false) }
    setDeleting(null); setConfirmDelete(null)
  }

  const filtered = filter === 'all' ? menu : menu.filter(m => m.category === filter)

  // Input style helper
  const inputStyle = {
    background: C.bg, border: `1px solid ${C.border}`, color: C.text,
    borderRadius: 10, padding: '10px 14px', fontSize: 14, width: '100%',
    outline: 'none', transition: 'border-color 0.15s',
  }

  return (
    <div className="min-h-dvh" style={{ background: C.bg }}>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{ background: `${C.bg}F2`, borderColor: C.border }}>
        <div className="flex items-center justify-between px-4 lg:px-6 py-4">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')}
              className="p-2 rounded-lg border transition-colors hover:bg-white/5"
              style={{ borderColor: C.border, color: C.muted }}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-lg font-semibold" style={{ color: C.text }}>Kelola Menu</h1>
              <p className="text-xs" style={{ color: C.muted }}>{menu.length} item · {filtered.length} ditampilkan</p>
            </div>
          </div>

          {/* Right */}
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 active:scale-95"
            style={{ background: C.accent, color: '#000' }}>
            <Plus size={15} />
            Tambah Menu
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 px-4 lg:px-6 pb-3 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(c => {
            const count = c.key === 'all' ? menu.length : menu.filter(m => m.category === c.key).length
            const active = filter === c.key
            return (
              <button key={c.key} onClick={() => setFilter(c.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-150 border"
                style={active
                  ? { background: C.accent, color: '#000', borderColor: C.accent }
                  : { background: 'transparent', color: C.muted, borderColor: C.border }
                }>
                {c.icon} {c.label}
                <span className="text-[10px] font-bold px-1 rounded"
                  style={{ background: active ? 'rgba(0,0,0,0.15)' : C.card }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </header>

      {/* ── Menu Grid ────────────────────────────────────────── */}
      <main className="px-4 lg:px-6 py-6 pb-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-2xl mb-5 flex items-center justify-center"
              style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <UtensilsCrossed size={28} style={{ color: C.muted }} />
            </div>
            <p className="text-base font-medium mb-1.5" style={{ color: C.text }}>Belum ada menu</p>
            <p className="text-sm mb-6" style={{ color: C.muted }}>Tambahkan menu pertama untuk kategori ini</p>
            <button onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
              style={{ background: C.accent, color: '#000' }}>
              <Plus size={15} /> Tambah Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(item => (
              <MenuCard
                key={item.id}
                item={item}
                onEdit={() => openEdit(item)}
                onDelete={() => setConfirmDelete(item)}
                deleting={deleting === item.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Add/Edit Modal ────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg border rounded-t-2xl sm:rounded-2xl max-h-[92dvh] overflow-y-auto animate-slide-up"
            style={{ background: C.card, borderColor: C.border }}>

            {/* Modal header */}
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b z-10"
              style={{ background: C.card, borderColor: C.border }}>
              <h2 className="font-semibold text-base" style={{ color: C.text }}>
                {editItem ? 'Edit Menu' : 'Tambah Menu Baru'}
              </h2>
              <button onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: C.muted }}>
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-5">
              {/* Image */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2.5" style={{ color: C.muted }}>
                  Foto Menu
                </label>
                {form.image && !imgPreviewError && (
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-3" style={{ background: C.bg }}>
                    <Image src={form.image} alt="preview" fill className="object-cover"
                      onError={() => setImgPreviewError(true)} />
                  </div>
                )}
                <input type="url" placeholder="Paste URL foto... (https://...)"
                  value={form.image}
                  onChange={e => { setForm(f => ({ ...f, image: e.target.value })); setImgPreviewError(false) }}
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = C.accent}
                  onBlur={e => e.currentTarget.style.borderColor = C.border}
                />
                <div className="flex items-center gap-2 mt-2">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors hover:bg-white/5"
                    style={{ borderColor: C.border, color: C.muted }}>
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    {uploading ? 'Mengupload...' : 'Upload dari HP/PC'}
                  </button>
                  <span className="text-[11px]" style={{ color: '#444' }}>atau paste URL di atas</span>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </div>

              {/* Names */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2.5" style={{ color: C.muted }}>
                  Nama Menu
                </label>
                <div className="space-y-2.5">
                  {[
                    { flag: '🇮🇩', lang: 'Indonesia', key: 'name_id', req: true },
                    { flag: '🇬🇧', lang: 'English',   key: 'name_en', req: false },
                    { flag: '🇸🇦', lang: 'العربية',   key: 'name_ar', req: false, rtl: true },
                  ].map(f => (
                    <div key={f.key}>
                      <p className="text-[11px] mb-1" style={{ color: C.muted }}>
                        {f.flag} {f.lang}{f.req && <span style={{ color: C.danger }}>*</span>}
                      </p>
                      <input
                        type="text"
                        placeholder={f.flag === '🇮🇩' ? 'cth: Mie Goreng Ayam' : f.flag === '🇬🇧' ? 'e.g. Chicken Fried Noodles' : 'مثال: نودلز'}
                        value={form[f.key as keyof FormData] as string}
                        onChange={e => setForm(fv => ({ ...fv, [f.key]: e.target.value }))}
                        dir={f.rtl ? 'rtl' : 'ltr'}
                        style={inputStyle}
                        onFocus={e => e.currentTarget.style.borderColor = C.accent}
                        onBlur={e => e.currentTarget.style.borderColor = C.border}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2.5" style={{ color: C.muted }}>
                  Deskripsi <span className="normal-case font-normal">(opsional)</span>
                </label>
                <div className="space-y-2.5">
                  {[
                    { flag: '🇮🇩', key: 'description_id', placeholder: 'Deskripsi singkat...', rtl: false },
                    { flag: '🇬🇧', key: 'description_en', placeholder: 'Short description...', rtl: false },
                    { flag: '🇸🇦', key: 'description_ar', placeholder: 'وصف قصير...', rtl: true },
                  ].map(f => (
                    <div key={f.key}>
                      <p className="text-[11px] mb-1" style={{ color: C.muted }}>{f.flag}</p>
                      <textarea
                        placeholder={f.placeholder}
                        value={form[f.key as keyof FormData] as string}
                        onChange={e => setForm(fv => ({ ...fv, [f.key]: e.target.value }))}
                        rows={2} dir={f.rtl ? 'rtl' : 'ltr'}
                        style={{ ...inputStyle, resize: 'none' }}
                        onFocus={e => e.currentTarget.style.borderColor = C.accent}
                        onBlur={e => e.currentTarget.style.borderColor = C.border}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Price + Cook time + Calories */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Harga (SR)', key: 'price', placeholder: '0', req: true },
                  { label: 'Waktu (mnt)', key: 'cook_time', placeholder: '15', req: false },
                  { label: 'Kalori', key: 'calories', placeholder: 'kcal', req: false },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[11px] mb-1.5" style={{ color: C.muted }}>
                      {f.label}{f.req && <span style={{ color: C.danger }}> *</span>}
                    </label>
                    <input
                      type="number"
                      placeholder={f.placeholder}
                      value={form[f.key as keyof FormData] as string}
                      onChange={e => setForm(fv => ({ ...fv, [f.key]: e.target.value }))}
                      min="0"
                      style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = C.accent}
                      onBlur={e => e.currentTarget.style.borderColor = C.border}
                    />
                  </div>
                ))}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2.5" style={{ color: C.muted }}>
                  Kategori
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.filter(c => c.key !== 'all').map(c => (
                    <button key={c.key} type="button" onClick={() => setForm(f => ({ ...f, category: c.key }))}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all duration-150"
                      style={form.category === c.key
                        ? { background: `${C.accent}15`, borderColor: C.accent, color: C.accent }
                        : { background: 'transparent', borderColor: C.border, color: C.muted }
                      }>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'is_best_seller', label: '⭐ Best Seller' },
                  { key: 'is_available',   label: '✅ Tersedia' },
                ].map(t => (
                  <button key={t.key} type="button"
                    onClick={() => setForm(f => ({ ...f, [t.key]: !f[t.key as keyof FormData] }))}
                    className="py-3 rounded-lg border text-sm font-medium transition-all duration-150"
                    style={form[t.key as keyof FormData]
                      ? { background: `${C.accent}10`, borderColor: C.accent, color: C.accent }
                      : { background: 'transparent', borderColor: C.border, color: C.muted }
                    }>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Save button */}
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ background: C.accent, color: '#000' }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {saving ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Tambah Menu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative w-full max-w-xs rounded-xl border p-6 text-center animate-fade-in"
            style={{ background: C.card, borderColor: `${C.danger}40` }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: `${C.danger}15` }}>
              <Trash2 size={22} style={{ color: C.danger }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: C.text }}>Hapus Menu?</p>
            <p className="text-sm mb-5" style={{ color: C.muted }}>
              <strong style={{ color: C.text }}>{confirmDelete.name_id}</strong> akan dihapus permanen.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors hover:bg-white/5"
                style={{ borderColor: C.border, color: C.muted }}>
                Batal
              </button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={!!deleting}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: C.danger, color: '#fff' }}>
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
