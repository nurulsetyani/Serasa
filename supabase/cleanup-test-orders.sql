-- ============================================================
-- Cleanup: hapus order test ("Ahmad" / "Muhammad", Meja 5)
-- Jalankan di: Supabase Dashboard > SQL Editor
-- ============================================================

-- STEP 1 — PREVIEW dulu. Cek hasilnya, pastikan SEMUA baris
-- yang muncul memang order test (bukan order asli dari customer
-- yang kebetulan namanya sama).
SELECT id, order_number, customer_name, table_number, order_type,
       status, total_price, source, created_at
FROM orders
WHERE restaurant_id = '550e8400-e29b-41d4-a716-446655440000'
  AND table_number = '5'
  AND customer_name IN ('Ahmad', 'Muhammad')
ORDER BY created_at;

-- STEP 2 — Hapus berdasarkan ID spesifik dari hasil STEP 1.
-- order_items & reviews ikut terhapus otomatis (ON DELETE CASCADE).
-- Ganti list id di bawah dengan id yang muncul di STEP 1, lalu jalankan.
--
-- DELETE FROM orders
-- WHERE id IN (
--   'id-pertama-disini',
--   'id-kedua-disini'
-- );

-- Catatan: kalau order tersebut pernah memicu print job (print_jobs),
-- baris print_jobs lama-nya tidak ikut terhapus (tidak ada FK),
-- tapi itu cuma log riwayat print dan tidak berpengaruh ke aplikasi.
