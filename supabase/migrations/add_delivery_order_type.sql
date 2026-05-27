-- Migration: add 'delivery' to orders.order_type CHECK constraint
-- Required for HungerStation and Keeta webhook orders

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_order_type_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_order_type_check
    CHECK (order_type IN ('dine_in', 'take_away', 'delivery'));
