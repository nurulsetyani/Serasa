-- Migration: Add Foodics-style order statuses
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    -- New statuses (Foodics-style flow)
    'new', 'accepted', 'preparing', 'ready', 'served', 'awaiting_payment', 'paid',
    -- Legacy statuses (existing orders keep working)
    'pending', 'cooking', 'delivered', 'cancelled'
  ));
