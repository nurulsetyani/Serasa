-- Migration: add 'new' and 'cancelled' to orders.status CHECK constraint
-- 'new' = QR order waiting for cashier confirmation (not yet visible in KDS)
-- 'cancelled' = voided order (was missing from original constraint)

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
    CHECK (status IN ('new', 'pending', 'cooking', 'ready', 'delivered', 'cancelled'));
