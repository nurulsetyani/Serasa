-- Migration: print_jobs table untuk thermal printer queue
-- Jalankan di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS print_jobs (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id TEXT,
  order_id      UUID,
  type          TEXT        NOT NULL DEFAULT 'cashier', -- 'cashier' | 'kitchen'
  status        TEXT        NOT NULL DEFAULT 'pending', -- 'pending' | 'printing' | 'done' | 'error'
  payload       JSONB       NOT NULL DEFAULT '{}',
  error_msg     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  printed_at    TIMESTAMPTZ
);

-- Index untuk agent query (pending jobs only)
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status, created_at);

-- RLS: service_role bisa semua, anon hanya INSERT
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON print_jobs
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "anon_insert" ON print_jobs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_select" ON print_jobs
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_update" ON print_jobs
  FOR UPDATE TO anon, authenticated USING (true);

-- Enable Realtime agar print agent bisa subscribe
ALTER PUBLICATION supabase_realtime ADD TABLE print_jobs;
