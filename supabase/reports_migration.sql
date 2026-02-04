-- ============================================
-- User reports table (問題回報 - 介面內留言給後台)
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_user_created ON reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own reports; no SELECT/UPDATE/DELETE for users (backend reads via service role)
DROP POLICY IF EXISTS "Users can submit own reports" ON reports;
CREATE POLICY "Users can submit own reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Optional: allow users to read their own reports (e.g. "My reports" list). Omit if not needed.
-- CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = user_id);

COMMENT ON TABLE public.reports IS 'User problem reports / feedback sent from in-app form (no mailto).';
