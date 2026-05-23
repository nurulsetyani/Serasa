-- Add platform_order_id to store external delivery platform order reference
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_order_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_platform_order_id
  ON orders(platform_order_id)
  WHERE platform_order_id IS NOT NULL;
