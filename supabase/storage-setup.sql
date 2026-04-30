-- ============================================================
-- SETUP STORAGE BUCKET untuk upload foto menu
-- Jalankan di Supabase SQL Editor
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Allow public read
CREATE POLICY "Public read menu images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-images');

-- Allow upload (insert)
CREATE POLICY "Allow upload menu images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'menu-images');

-- Allow update
CREATE POLICY "Allow update menu images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'menu-images');

-- Allow delete
CREATE POLICY "Allow delete menu images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'menu-images');
