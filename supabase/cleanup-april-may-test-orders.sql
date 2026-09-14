-- ============================================================
-- Cleanup: hapus SEMUA order bulan April & Mei 2026 (data testing)
-- Jalankan di: Supabase Dashboard > SQL Editor
-- ============================================================

-- STEP 1 — PREVIEW dulu. Cek jumlah & total-nya, pastikan memang
-- cuma data testing (bukan order asli customer).
SELECT
  to_char(created_at, 'YYYY-MM') AS bulan,
  count(*)                       AS jumlah_order,
  sum(total_price)                AS total
FROM orders
WHERE restaurant_id = '550e8400-e29b-41d4-a716-446655440000'
  AND created_at >= '2026-04-01'
  AND created_at <  '2026-06-01'
GROUP BY 1
ORDER BY 1;

-- STEP 1b — (opsional) lihat detail baris per order kalau mau cek satu-satu
-- SELECT id, order_number, customer_name, table_number, status, total_price, created_at
-- FROM orders
-- WHERE restaurant_id = '550e8400-e29b-41d4-a716-446655440000'
--   AND created_at >= '2026-04-01'
--   AND created_at <  '2026-06-01'
-- ORDER BY created_at;

-- STEP 2 — Kalau hasil STEP 1 sudah sesuai (memang cuma testing April-Mei),
-- baru jalankan DELETE ini. order_items & reviews ikut terhapus otomatis
-- (ON DELETE CASCADE). AKSI INI PERMANEN, TIDAK BISA DIBATALKAN.
--
-- DELETE FROM orders
-- WHERE restaurant_id = '550e8400-e29b-41d4-a716-446655440000'
--   AND created_at >= '2026-04-01'
--   AND created_at <  '2026-06-01';

-- Catatan: kalau order tersebut pernah memicu print job (print_jobs),
-- baris print_jobs lama-nya tidak ikut terhapus (tidak ada FK),
-- tapi itu cuma log riwayat print dan tidak berpengaruh ke aplikasi.
