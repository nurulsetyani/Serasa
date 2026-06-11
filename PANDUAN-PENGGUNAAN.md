# Panduan Penggunaan — Sistem Serasa Restaurant

Panduan ini untuk pemilik & staf restoran (kasir, dapur) — cara pakai sistem sehari-hari.
Alamat website: **https://serasa-opal.vercel.app**

---

## ⚠️ Catatan Penting Sebelum Mulai

1. **Halaman staf (`/admin`, `/pos`, `/kitchen`, `/qr`) sekarang dilindungi password.** Saat pertama kali buka salah satu link ini di sebuah perangkat, akan muncul halaman **Login Staf** — masukkan password staf, lalu perangkat tersebut akan "diingat" selama 30 hari (tidak perlu login ulang tiap hari).
   - Password staf: tanyakan ke developer (saya).
   - **Tetap jangan share link `/admin`, `/pos`, atau `/kitchen` ke pelanggan** — cukup link `/menu?table=X` (lewat QR code di meja) yang boleh diakses pelanggan.
   - Lupa password, atau ada perangkat hilang dan perlu "logout paksa" semua orang? Hubungi developer — password bisa diganti kapan saja.
2. **Printer struk & nota dapur** butuh setup tambahan di komputer kasir (lihat bagian [Printer](#-printer-struk--nota-dapur) di bawah).

---

## Daftar Isi

1. [Alur Kerja Singkat](#alur-kerja-singkat)
2. [POS / Kasir](#-pos--kasir)
3. [Kitchen Display (Dapur)](#-kitchen-display-dapur)
4. [Admin Dashboard](#-admin-dashboard)
5. [Kelola Menu](#-kelola-menu)
6. [Laporan Penjualan](#-laporan-penjualan)
7. [Status Meja](#-status-meja)
8. [QR Code Meja](#-qr-code-meja)
9. [Printer Struk & Nota Dapur](#-printer-struk--nota-dapur)
10. [Bantuan / Kontak Developer](#-bantuan--kontak-developer)

---

## Alur Kerja Singkat

**Pesanan dari pelanggan (scan QR di meja):**
1. Pelanggan scan QR code di meja → buka menu di HP → pilih makanan → checkout
2. Pesanan otomatis masuk ke **Kitchen Display** (dapur) dan **Admin Dashboard**
3. Dapur masak, update status di Kitchen Display (Terima → Mulai Masak → Siap Saji → Sajikan)
4. Saat pelanggan mau bayar, kasir buka **POS → Monitor Pesanan**, klik **"Minta Bayar"**, lalu proses pembayaran di POS
5. Struk otomatis tercetak (kalau printer sudah disetup)

**Pesanan langsung dari kasir (walk-in / take away):**
1. Kasir buka **POS**, pilih meja & jenis order
2. Tambah item ke keranjang, lalu **Bayar**
3. Struk pelanggan + nota dapur otomatis tercetak

---

## 🛒 POS / Kasir

**Link:** `https://serasa-opal.vercel.app/pos`

Halaman ini dipakai kasir untuk input pesanan langsung dan memproses pembayaran.

### Bagian Layar
- **Kiri:** Daftar menu — bisa cari (search bar atas, atau tekan `F1`) dan filter per kategori (tab horizontal: Semua, Noodles, Rice, Grills, dll)
- **Kanan:** Keranjang (Cart) — daftar item yang dipesan + total harga

### Cara Input Pesanan Baru
1. Klik **"Pilih Meja"** di atas keranjang → pilih nomor meja (1–8) → **Konfirmasi**
2. Pilih jenis order: **Dine-In**, **Takeaway**, atau **Delivery**
3. Klik menu di sebelah kiri untuk menambahkan ke keranjang (klik lagi untuk tambah jumlah)
4. Kalau ada catatan khusus (misal "tidak pedas"), tap item di keranjang untuk tambah catatan
5. Klik **"Bayar"** di bagian bawah keranjang
6. Pilih metode bayar (Tunai/Cash atau Online), masukkan jumlah uang
7. Selesai → struk otomatis tercetak (kalau printer aktif)

### Cara Proses Pesanan dari QR Meja (Pelanggan Sudah Order via HP)
1. Klik tombol **"Monitor Pesanan"** (badge oranye, di banner atas, muncul kalau ada pesanan masuk)
2. Lihat daftar pesanan dari QR — status **"Tagih!"** (merah) artinya pelanggan sudah minta bayar, atau kasir bisa klik **"Minta Bayar"** dulu kalau pelanggan baru selesai makan
3. Klik **"Checkout & Bayar"** pada pesanan tersebut → pesanan otomatis masuk ke keranjang
4. Lanjutkan proses bayar seperti biasa (langkah 6–7 di atas)

> ⚠️ **Penting:** Jangan klik "Order Lagi" di HP pelanggan setelah checkout selesai — itu akan membuat pesanan baru terpisah (duplikat), bukan melanjutkan pesanan yang sama.

### Pesanan dari HungerStation / Keeta (kalau sudah aktif)
- Tombol **"HungerStation"** / **"Keeta"** di banner atas akan muncul kalau ada pesanan masuk dari platform delivery tersebut
- Klik untuk lihat detail & terima pesanan

---

## 🍳 Kitchen Display (Dapur)

**Link:** `https://serasa-opal.vercel.app/kitchen`

Layar ini sebaiknya dipasang di TV/monitor dapur, menyala terus.

### Tampilan
3 kolom status pesanan:
- **📭 BARU** — pesanan baru masuk
- **🍳 MASAK** — sedang dimasak
- **✅ SIAP** — siap diantar/diambil

### Cara Pakai (Staf Dapur)
1. Pesanan baru muncul di kolom **BARU**, disertai bunyi notifikasi + banner "PESANAN BARU — MEJA #X"
2. Klik **"TERIMA"** → pesanan pindah ke status diterima
3. Klik **"MULAI MASAK"** → pindah ke kolom **MASAK**
4. Setelah selesai masak, klik **"SIAP SAJI"** → pindah ke kolom **SIAP**
5. Setelah diantar ke meja, klik **"SAJIKAN"**

Setiap kartu pesanan menampilkan: nomor meja (besar), nama pelanggan, daftar item + catatan khusus (kotak oranye "⚑"), dan timer berapa lama pesanan sudah menunggu.

Kalau semua pesanan sudah selesai, layar menampilkan **"SEMUA BERES"**.

---

## 📊 Admin Dashboard

**Link:** `https://serasa-opal.vercel.app/admin`

Halaman utama untuk pemilik memantau semua pesanan secara real-time.

### Navigasi (menu samping kiri / hamburger di HP)
- **Pesanan** — daftar semua pesanan (halaman utama)
- **Kelola Menu** — atur menu makanan
- **Kitchen Display** — buka tampilan dapur
- **Laporan** — laporan penjualan
- **Status Meja** — lihat meja mana yang kosong/terisi

### Dashboard Pesanan
- **Filter tanggal:** Hari Ini, 7 Hari, Bulan Ini, Semua
- **Filter status:** Semua, Menunggu, Pending, Cooking, Ready, Delivered
- **4 kartu ringkasan:** Total Pesanan, Pendapatan Hari Ini, Belum Konfirmasi, Selesai
- Setiap pesanan ditampilkan sebagai kartu: nomor meja, nama pelanggan, jam, status (badge warna), daftar item, total harga

### Arti Status (Badge Warna)
| Status | Arti |
|---|---|
| Menunggu (ungu) | Pesanan baru masuk, belum diproses |
| Diterima (oranye) | Dapur sudah terima |
| Dimasak (merah) | Sedang dimasak |
| Siap (hijau) | Siap disajikan |
| Disajikan (cyan) | Sudah diantar ke meja |
| **Tagih** (merah) | Pelanggan minta dibayar / siap checkout |
| Lunas (indigo) | Sudah dibayar lunas |

> Halaman ini **read-only / monitor saja** — untuk memproses pembayaran tetap lewat **POS**.

---

## 🍜 Kelola Menu

**Link:** `https://serasa-opal.vercel.app/admin/menu`

Untuk menambah, mengubah, atau menghapus menu makanan.

### Cara Tambah Menu Baru
1. Klik tombol **"Tambah"**
2. Isi nama menu (Indonesia, Inggris, Arab — minimal nama Indonesia & harga wajib)
3. Isi harga, kategori, deskripsi (opsional)
4. Upload foto menu (klik area foto → pilih gambar dari HP/komputer)
5. Klik **"Simpan"**

### Cara Edit / Hapus Menu
1. Klik menu yang mau diubah → klik **"Edit"**
2. Ubah data yang perlu (harga, nama, foto, dll) → **"Simpan"**
3. Untuk hapus: klik **"Hapus"** → konfirmasi

### Tips
- Menu yang **non-aktif/habis** bisa di-toggle agar tidak muncul di menu pelanggan, tanpa harus dihapus permanen
- Foto sebaiknya rasio persegi (1:1) dan terang, agar tampil bagus di HP pelanggan

---

## 📈 Laporan Penjualan

**Link:** `https://serasa-opal.vercel.app/admin/laporan`

### Cara Pakai
1. Pilih periode: **Hari Ini**, **Kemarin**, **7 Hari**, **Bulan Ini**, **30 Hari**
2. Lihat ringkasan: Total Pendapatan, Total Pesanan, Rata-rata per Pesanan, Jam Sibuk
3. Lihat grafik: tren pendapatan, breakdown per platform (Kasir/QR/HungerStation/Keeta), jenis order
4. Lihat **"Menu Terlaris"** — daftar item paling laku
5. Tabel detail semua pesanan di bawah

### Export
- Klik **"Export CSV"** untuk download data ke Excel
- Klik tombol print (browser) untuk cetak laporan

---

## 🪑 Status Meja

**Link:** `https://serasa-opal.vercel.app/admin/tables`

Lihat status semua meja secara real-time:
- 🟢 **Hijau** = Kosong, siap dipakai
- 🟠 **Oranye** = Terisi, pelanggan sedang makan
- 🔴 **Merah** = Tagihan menunggu (pelanggan minta bayar)

Tiap meja menampilkan nama pelanggan, jumlah pesanan, dan sudah berapa lama duduk.

---

## 🔳 QR Code Meja

**Link:** `https://serasa-opal.vercel.app/qr`

Untuk cetak QR code yang ditempel di tiap meja (1–8), supaya pelanggan bisa scan & order sendiri dari HP.

### Cara Cetak
1. Buka halaman `/qr`
2. Akan muncul 8 kartu QR code (1 per meja)
3. Klik **"🖨️ Print Semua"**
4. Di pengaturan print browser: pilih kertas **A4**, orientasi **Portrait**, margin **None/Tidak ada**, centang **"Background graphics"**
5. Gunting per kartu, laminating (opsional), tempel di masing-masing meja sesuai nomor

> Kalau alamat website berubah di kemudian hari, ubah field **"URL App"** di halaman ini lalu klik **"Terapkan"** sebelum cetak ulang.

---

## 🖨 Printer Struk & Nota Dapur

Sistem sudah bisa **cetak struk pelanggan otomatis** (saat kasir klik Bayar di POS) dan **cetak nota dapur otomatis** (setiap ada pesanan baru) — asalkan **print-agent** sudah berjalan di komputer kasir yang terhubung ke printer thermal 80mm.

### Setup (sekali saja, dilakukan developer/teknisi)
1. Jalankan migrasi tabel `print_jobs` di Supabase
2. Install `print-agent` di komputer kasir, hubungkan ke printer
3. Jalankan `node agent.js` — biarkan menyala terus selama jam operasional

### Untuk Staf Sehari-hari
- Tidak perlu klik apa-apa — struk & nota dapur tercetak otomatis
- Kalau printer **tidak mengeluarkan struk**:
  1. Cek kabel USB printer & power
  2. Cek apakah program "print-agent" (jendela hitam/CMD) masih terbuka & berjalan di komputer kasir — kalau tertutup, buka lagi (lihat shortcut di Desktop atau folder Startup)
  3. Cek kertas thermal habis atau tidak
  4. Kalau masih bermasalah, hubungi developer

---

## 🆘 Bantuan / Kontak Developer

Kalau ada error, halaman blank, atau butuh fitur tambahan (misal: tambah meja, ubah info restoran, integrasi pembayaran online, dll), hubungi:

**[Isi nama & kontak WhatsApp/email Anda di sini]**
