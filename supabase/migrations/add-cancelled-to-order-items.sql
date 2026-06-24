-- Migration: tambah kolom cancelled di order_items
-- Jalankan di Supabase Dashboard > SQL Editor

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS cancelled BOOLEAN NOT NULL DEFAULT FALSE;
