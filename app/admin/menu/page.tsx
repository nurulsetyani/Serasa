'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Plus, Pencil, Trash2, X, Check, ArrowLeft,
  Upload, Clock, Star, Eye, EyeOff, Loader2
} from 'lucide-react'
import { MenuItem } from '@/types'
import { supabase } from '@/lib/supabase'

const CATEGORIES = [
  { key: 'all',        label: 'Semua',        icon: '✦'  },
  { key: 'signature',  label: 'Signature',    icon: '⭐' },
  { key: 'mix_rice',   label: 'Mix Rice',     icon: '🍱' },
  { key: 'fried_rice', label: 'Fried Rice',   icon: '🍳' },
  { key: 'noodles',    label: 'Noodles',      icon: '🍜' },
  { key: 'satay',      label: 'Satay',        icon: '🍢' },
  { key: 'appetizer',  label: 'Appetizer',    icon: '🥗' },
  { key: 'meat',       label: 'Meat',         icon: '🥩' },
  { key: 'chicken',    label: 'Chicken',      icon: '🍗' },
  { key: 'bebek',      label: 'Bebek',        icon: '🦆' },
  { key: 'rice_bowl',  label: 'Rice Bowl',    icon: '🍚' },
  { key: 'seafood',    label: 'Seafood',      icon: '🦐' },
  { key: 'soup',       label: 'Soup',         icon: '🍲' },
  { key: 'extra',      label: 'Extra',        icon: '➕' },
  { key: 'drinks',     label: 'Drinks',       icon: '🥤' },
]

const EMPTY_FORM = {
  name_id: '', name_en: '', name_ar: '',
  description_id: '', description_en: '', description_ar: '',
  price: '', cook_time: '15', category: 'main',
  image: '', is_best_seller: false, is_available: true,
}

type FormData = typeof EMPTY_FORM

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
    setEditItem(null)
    setForm(EMPTY_FORM)
    setImgPreviewError(false)
    setShowForm(true)
  }

  function openEdit(item: MenuItem) {
    setEditItem(item)
    setForm({
      name_id: item.name_id, name_en: item.name_en, name_ar: item.name_ar,
      description_id: item.description_id ?? '',
      description_en: item.description_en ?? '',
      description_ar: item.description_ar ?? '',
      price: String(item.price),
      cook_time: String(item.cook_time),
      category: item.category,
      image: item.image ?? '',
      is_best_seller: item.is_best_seller,
      is_available: item.is_available ?? true,
    })
    setImgPreviewError(false)
    setShowForm(true)
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
      setForm(f => ({ ...f, image: publicUrl }))
      setImgPreviewError(false)
      showToast('Foto berhasil diupload!')
    } catch {
      showToast('Gagal upload foto. Coba paste URL saja.', false)
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSave() {
    if (!form.name_id.trim() || !form.price) {
      showToast('Nama (Indonesia) dan harga wajib diisi', false)
      return
    }
    setSaving(true)
    const payload = {
      name_id: form.name_id.trim(),
      name_en: form.name_en.trim() || form.name_id.trim(),
      name_ar: form.name_ar.trim() || form.name_id.trim(),
      description_id: form.description_id.trim() || null,
      description_en: form.description_en.trim() || null,
      description_ar: form.description_ar.trim() || null,
      price: parseFloat(form.price),
      cook_time: parseInt(form.cook_time) || 15,
      category: form.category,
      image: form.image.trim() || null,
      is_best_seller: form.is_best_seller,
      is_available: form.is_available,
    }

    const url = editItem ? `/api/menu/${editItem.id}` : '/api/menu'
    const method = editItem ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      showToast(editItem ? 'Menu berhasil diperbarui!' : 'Menu berhasil ditambahkan!')
      setShowForm(false)
      fetchMenu()
    } else {
      const err = await res.json()
      showToast(err.error ?? 'Gagal menyimpan', false)
    }
    setSaving(false)
  }

  async function handleDelete(item: MenuItem) {
    setDeleting(item.id)
    const res = await fetch(`/api/menu/${item.id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Menu dihapus!')
      setMenu(prev => prev.filter(m => m.id !== item.id))
    } else {
      showToast('Gagal menghapus', false)
    }
    setDeleting(null)
    setConfirmDelete(null)
  }

  const filtered = filter === 'all' ? menu : menu.filter(m => m.category === filter)

  return (
    <div className="min-h-dvh bg-[#0D0D0D]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl flex items-center gap-2 animate-fade-in ${
          toast.ok ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.ok ? <Check size={16} /> : <X size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-[#D4AF37]/12 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')}
              className="p-2 rounded-xl bg-[#1A1A1A] border border-white/8 text-[#888] hover:text-white transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-display text-xl font-bold text-white">Kelola Menu</h1>
              <p className="text-[#555] text-xs">{menu.length} item terdaftar</p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-[#D4AF37] text-[#0D0D0D] px-4 py-2.5 rounded-xl font-bold text-sm shadow-[0_2px_16px_rgba(212,175,55,0.35)] active:scale-95 transition-transform"
          >
            <Plus size={16} />
            Tambah Menu
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                filter === c.key
                  ? 'bg-[#D4AF37] text-[#0D0D0D]'
                  : 'bg-[#1A1A1A] text-[#666] border border-[#D4AF37]/12 hover:border-[#D4AF37]/30 hover:text-white'
              }`}
            >
              {c.icon} {c.label}
              {c.key !== 'all' && (
                <span className="text-[10px] opacity-60">
                  ({menu.filter(m => m.category === c.key).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Menu list */}
      <main className="px-4 py-4 pb-10 space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">🍽️</span>
            <p className="text-[#555] mb-4">Belum ada menu di kategori ini</p>
            <button onClick={openAdd} className="bg-[#D4AF37] text-[#0D0D0D] px-6 py-2.5 rounded-xl font-bold text-sm">
              + Tambah Menu
            </button>
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="flex gap-3 bg-[#1A1A1A] rounded-2xl overflow-hidden border border-white/5">
              {/* Image */}
              <div className="relative w-24 h-24 flex-shrink-0 bg-[#222]">
                {item.image ? (
                  <Image src={item.image} alt={item.name_id} fill className="object-cover" sizes="96px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-3xl">🍽️</div>
                )}
                {!item.is_available && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold bg-red-500 px-2 py-0.5 rounded-full">NONAKTIF</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 py-3 pr-3 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-white font-semibold text-sm line-clamp-1">{item.name_id}</p>
                    {item.is_best_seller && <Star size={11} className="text-[#D4AF37] fill-[#D4AF37] flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-2 py-0.5 rounded-full font-semibold">
                      {CATEGORIES.find(c => c.key === item.category)?.icon} {CATEGORIES.find(c => c.key === item.category)?.label ?? item.category}
                    </span>
                    <span className="text-[#555] text-[10px] flex items-center gap-0.5">
                      <Clock size={9} /> {item.cook_time}m
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[#D4AF37] font-black text-sm">{item.price} SR</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(item)}
                      disabled={deleting === item.id}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      {deleting === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* ── Add/Edit Modal ────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-t-3xl sm:rounded-3xl max-h-[92dvh] overflow-y-auto animate-slide-up">
            {/* Modal header */}
            <div className="sticky top-0 bg-[#1A1A1A] flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5 z-10">
              <h2 className="font-display text-white font-bold text-lg">
                {editItem ? '✏️ Edit Menu' : '➕ Tambah Menu Baru'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-[#666] hover:text-white transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-5">
              {/* Image */}
              <div>
                <label className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-2 block">
                  Foto Menu
                </label>
                {/* Preview */}
                {form.image && !imgPreviewError && (
                  <div className="relative h-40 rounded-2xl overflow-hidden mb-3 bg-[#222]">
                    <Image
                      src={form.image}
                      alt="preview"
                      fill
                      className="object-cover"
                      onError={() => setImgPreviewError(true)}
                    />
                  </div>
                )}
                {/* URL input */}
                <input
                  type="url"
                  placeholder="Paste URL foto... (https://...)"
                  value={form.image}
                  onChange={e => { setForm(f => ({ ...f, image: e.target.value })); setImgPreviewError(false) }}
                  className="input-dark w-full px-4 py-3 text-sm rounded-xl mb-2"
                />
                {/* Upload button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 bg-[#222] border border-white/10 text-[#888] hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploading ? 'Mengupload...' : 'Upload dari HP/PC'}
                  </button>
                  <span className="text-[#444] text-[11px]">atau paste URL di atas</span>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </div>

              {/* Names */}
              <div className="space-y-3">
                <label className="text-[#888] text-xs font-semibold uppercase tracking-wider block">
                  Nama Menu
                </label>
                <div>
                  <p className="text-[#555] text-[11px] mb-1">🇮🇩 Indonesia <span className="text-red-400">*</span></p>
                  <input
                    type="text"
                    placeholder="cth: Mie Goreng Ayam"
                    value={form.name_id}
                    onChange={e => setForm(f => ({ ...f, name_id: e.target.value }))}
                    className="input-dark w-full px-4 py-3 text-sm rounded-xl"
                  />
                </div>
                <div>
                  <p className="text-[#555] text-[11px] mb-1">🇬🇧 English</p>
                  <input
                    type="text"
                    placeholder="e.g. Chicken Fried Noodles"
                    value={form.name_en}
                    onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                    className="input-dark w-full px-4 py-3 text-sm rounded-xl"
                  />
                </div>
                <div>
                  <p className="text-[#555] text-[11px] mb-1">🇸🇦 العربية</p>
                  <input
                    type="text"
                    placeholder="مثال: نودلز مقلية بالدجاج"
                    dir="rtl"
                    value={form.name_ar}
                    onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))}
                    className="input-dark w-full px-4 py-3 text-sm rounded-xl"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-3">
                <label className="text-[#888] text-xs font-semibold uppercase tracking-wider block">
                  Deskripsi (opsional)
                </label>
                <div>
                  <p className="text-[#555] text-[11px] mb-1">🇮🇩 Indonesia</p>
                  <textarea
                    placeholder="Deskripsi singkat menu..."
                    value={form.description_id}
                    onChange={e => setForm(f => ({ ...f, description_id: e.target.value }))}
                    rows={2}
                    className="input-dark w-full px-4 py-3 text-sm rounded-xl resize-none"
                  />
                </div>
                <div>
                  <p className="text-[#555] text-[11px] mb-1">🇬🇧 English</p>
                  <textarea
                    placeholder="Short description..."
                    value={form.description_en}
                    onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))}
                    rows={2}
                    className="input-dark w-full px-4 py-3 text-sm rounded-xl resize-none"
                  />
                </div>
                <div>
                  <p className="text-[#555] text-[11px] mb-1">🇸🇦 العربية</p>
                  <textarea
                    placeholder="وصف قصير..."
                    dir="rtl"
                    value={form.description_ar}
                    onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))}
                    rows={2}
                    className="input-dark w-full px-4 py-3 text-sm rounded-xl resize-none"
                  />
                </div>
              </div>

              {/* Price + Cook time + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-2 block">
                    Harga (SR) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="input-dark w-full px-4 py-3 text-sm rounded-xl"
                    min="0"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-2 block">
                    Waktu Masak (menit)
                  </label>
                  <input
                    type="number"
                    placeholder="15"
                    value={form.cook_time}
                    onChange={e => setForm(f => ({ ...f, cook_time: e.target.value }))}
                    className="input-dark w-full px-4 py-3 text-sm rounded-xl"
                    min="1"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-2 block">
                  Kategori
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.filter(c => c.key !== 'all').map(c => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, category: c.key }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                        form.category === c.key
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]'
                          : 'bg-[#222] border-white/8 text-[#666] hover:border-white/20'
                      }`}
                    >
                      <span>{c.icon}</span>
                      <span className="text-xs">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-3">
                {[
                  { key: 'is_best_seller', label: '⭐ Best Seller' },
                  { key: 'is_available',   label: '✅ Tersedia' },
                ].map(toggle => (
                  <button
                    key={toggle.key}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, [toggle.key]: !f[toggle.key as keyof FormData] }))}
                    className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      form[toggle.key as keyof FormData]
                        ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37]'
                        : 'bg-[#222] border-white/8 text-[#555]'
                    }`}
                  >
                    {toggle.label}
                  </button>
                ))}
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 rounded-2xl bg-[#D4AF37] text-[#0D0D0D] font-black text-base flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,175,55,0.35)] active:scale-[0.98] transition-transform disabled:opacity-60"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {saving ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Tambah Menu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative w-full max-w-xs bg-[#1A1A1A] border border-red-500/30 rounded-2xl p-6 text-center animate-fade-in">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-white font-bold text-lg mb-2">Hapus Menu?</h3>
            <p className="text-[#888] text-sm mb-6">
              <strong className="text-white">{confirmDelete.name_id}</strong> akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl bg-[#222] border border-white/10 text-white font-semibold text-sm"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={!!deleting}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm disabled:opacity-60"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
