-- ============================================================
-- ADD COLUMNS: calories (menu) + notes (order_items)
-- Run in Supabase SQL Editor
-- ============================================================

-- Add calories to menu table
ALTER TABLE menu ADD COLUMN IF NOT EXISTS calories INTEGER;

-- Add notes to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name IN ('menu', 'order_items')
  AND column_name IN ('calories', 'notes')
ORDER BY table_name, column_name;
