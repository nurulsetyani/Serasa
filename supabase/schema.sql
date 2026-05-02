-- ============================================================
-- SERASA QR MENU — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Restaurants (multi-tenant) ────────────────────────────
CREATE TABLE restaurants (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tables ────────────────────────────────────────────────
CREATE TABLE tables (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  table_number  TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, table_number)
);

-- ── Menu ──────────────────────────────────────────────────
CREATE TABLE menu (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id  UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name_id        TEXT NOT NULL,
  name_en        TEXT NOT NULL,
  name_ar        TEXT NOT NULL,
  description_id TEXT,
  description_en TEXT,
  description_ar TEXT,
  price          NUMERIC(10,2) NOT NULL CHECK (price > 0),
  promo_price    NUMERIC(10,2) CHECK (promo_price > 0),
  cook_time      INTEGER NOT NULL DEFAULT 15 CHECK (cook_time > 0),
  image          TEXT,
  is_best_seller BOOLEAN NOT NULL DEFAULT FALSE,
  category       TEXT NOT NULL DEFAULT 'main',
  is_available   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Orders ────────────────────────────────────────────────
CREATE TABLE orders (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id  UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  order_number   TEXT,
  table_number   TEXT NOT NULL,
  customer_name  TEXT NOT NULL,
  order_type     TEXT NOT NULL DEFAULT 'dine_in'
                   CHECK (order_type IN ('dine_in','take_away')),
  payment_method TEXT NOT NULL DEFAULT 'cash'
                   CHECK (payment_method IN ('cash','online')),
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','cooking','ready','delivered')),
  total_price    NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Migration (run if table already exists) ───────────────
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number   TEXT;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type     TEXT NOT NULL DEFAULT 'dine_in' CHECK (order_type IN ('dine_in','take_away'));
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','online'));

-- ── Order Items ───────────────────────────────────────────
CREATE TABLE order_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id   UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  menu_id    UUID REFERENCES menu(id),
  name       TEXT NOT NULL,
  price      NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  qty        INTEGER NOT NULL CHECK (qty > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Reviews ───────────────────────────────────────────────
CREATE TABLE reviews (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id   UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────
CREATE INDEX idx_menu_restaurant ON menu(restaurant_id);
CREATE INDEX idx_menu_category ON menu(category);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ── Row Level Security ────────────────────────────────────
ALTER TABLE restaurants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables       ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews      ENABLE ROW LEVEL SECURITY;

-- Public read: restaurants, menu
CREATE POLICY "public_read_restaurants" ON restaurants FOR SELECT USING (true);
CREATE POLICY "public_read_menu"        ON menu        FOR SELECT USING (true);

-- Orders: public can create + read; service role updates
CREATE POLICY "public_create_orders"    ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_orders"      ON orders FOR SELECT USING (true);
CREATE POLICY "service_update_orders"   ON orders FOR UPDATE USING (true);

-- Order items: public create + read
CREATE POLICY "public_create_order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_order_items"   ON order_items FOR SELECT USING (true);

-- Reviews: public create + read
CREATE POLICY "public_create_reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_reviews"   ON reviews FOR SELECT USING (true);

-- ── Realtime ──────────────────────────────────────────────
-- Enable in Supabase Dashboard > Database > Replication
-- OR run:
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
