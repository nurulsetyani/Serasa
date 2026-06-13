# Panduan Setup Print Otomatis Struk — Komputer Kasir

Panduan ini untuk setup **print-agent**: program kecil yang harus jalan di
komputer kasir agar struk (cashier receipt) dan tiket dapur (kitchen ticket)
otomatis ke-print ke printer thermal setiap ada order baru.

**Syarat**: Komputer/laptop Windows + printer thermal USB 80mm + koneksi internet.

---

## Langkah 1 — Install Node.js

1. Buka [nodejs.org](https://nodejs.org)
2. Download versi **LTS** (yang kiri, ada tulisan "Recommended")
3. Install seperti biasa (klik Next terus sampai Finish)

Cek berhasil: buka **Command Prompt** (`Win + R` → ketik `cmd` → Enter), ketik:
```
node -v
```
Kalau muncul nomor versi (misal `v20.x.x`), berarti sudah berhasil.

---

## Langkah 2 — Pasang Printer Thermal sebagai Printer Windows

1. Colok printer thermal via USB
2. **Settings → Bluetooth & devices → Printers & scanners**
3. Kalau belum muncul, klik **Add device** dan tunggu Windows mendeteksi
4. **Catat nama printer PERSIS seperti yang tertulis** di list
   (contoh: `EPSON TM-T82`, `Xprinter XP-58`, `POS-80`)
   → nama ini dibutuhkan di Langkah 4

---

## Langkah 3 — Copy Folder `print-agent`

1. Salin folder `print-agent` (dan folder `Asset` yang ada di sebelahnya, satu
   tingkat di atas) ke komputer kasir — misalnya ke `C:\SerasaPrintAgent\`
   - Struktur yang dibutuhkan:
     ```
     C:\SerasaPrintAgent\
       ├── Asset\
       │     └── logof22.png
       └── print-agent\
             ├── agent.js
             ├── setup.js
             ├── package.json
             ├── .env.example
             └── ...
     ```
2. Buka Command Prompt, masuk ke folder `print-agent`:
   ```
   cd C:\SerasaPrintAgent\print-agent
   ```

---

## Langkah 4 — Install & Konfigurasi

1. Install dependencies:
   ```
   npm install
   ```
   (tunggu sampai selesai, biasanya 1-2 menit)

2. Copy `.env.example` jadi `.env`:
   ```
   copy .env.example .env
   ```

3. Buka file `.env` dengan Notepad:
   ```
   notepad .env
   ```

4. Isi/cek 3 baris ini:
   ```
   SUPABASE_URL=<isi dari developer>
   SUPABASE_ANON_KEY=<isi dari developer>
   PRINTER_NAME=<nama printer dari Langkah 2, harus PERSIS SAMA>
   ```
   `RESTAURANT_ID` dan `APP_URL` sudah terisi otomatis, tidak perlu diubah.

5. Save file (`Ctrl + S`), tutup Notepad.

---

## Langkah 5 — Siapkan Logo (sekali saja)

```
node setup.js
```
Harus muncul: `✓ Setup complete. Run: node agent.js`

---

## Langkah 6 — Jalankan Agent & Tes Print

```
node agent.js
```

Harus muncul:
```
╔══════════════════════════════════════════╗
║      SERASA Print Agent  v1.0            ║
╠══════════════════════════════════════════╣
║  Printer : <nama printer>                ║
║  Supabase: xxxx.supabase.co              ║
╚══════════════════════════════════════════╝

✓ Listening for print jobs... (Press Ctrl+C to stop)
```

Coba buat 1 order test dari POS — struk harus otomatis keluar dari printer.

**Jangan tutup jendela Command Prompt ini** — biarkan tetap terbuka/berjalan
selama kasir buka (lanjut ke Langkah 7 agar otomatis tanpa perlu buka manual
setiap hari).

---

## Langkah 7 — Auto-Start Saat Komputer Nyala

1. Buka Notepad, isi dengan ini, lalu save sebagai `start-agent.bat` di
   folder `print-agent` (pilih "All files" saat save, jangan `.txt`):
   ```bat
   @echo off
   cd /d "%~dp0"
   node agent.js
   pause
   ```
   *(file ini sudah dibuat otomatis — lihat `print-agent/start-agent.bat`)*

2. Tekan `Win + R`, ketik `shell:startup`, Enter — folder Startup terbuka

3. Klik kanan `start-agent.bat` → **Send to → Desktop (create shortcut)**

4. Pindahkan shortcut tersebut ke folder Startup yang terbuka di langkah 2

Sekarang setiap komputer dinyalakan, print-agent otomatis jalan di background.

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| `Printer "..." not connected` | Cek nama printer di `.env` sama persis dengan di Windows. Cek printer tidak dalam status "Paused" (klik kanan printer → lihat printing queue). |
| Order masuk tapi struk tidak keluar | Pastikan jendela `node agent.js` masih terbuka & ada tulisan "Listening for print jobs...". Kalau tertutup, buka lagi `start-agent.bat`. |
| Tulisan Arab jadi `???` di struk | Wajar — printer 80mm umumnya tidak support font Arab. Nama menu/resto tetap muncul dalam huruf Latin. |
| Internet putus lalu nyambung lagi | Jalankan ulang `node agent.js` (atau restart komputer) — order yang tertunda akan otomatis ke-print saat agent nyala lagi. |
