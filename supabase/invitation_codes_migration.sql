-- ============================================
-- Invitation Codes (邀請碼)
-- 給特殊邀請的人免費使用所有功能
-- ============================================
-- 在 Supabase SQL Editor 中運行此文件

-- 邀請碼表：code 為邀請碼，max_uses 為可使用次數，used_count 為已使用次數
CREATE TABLE IF NOT EXISTS invitation_codes (
  code TEXT PRIMARY KEY,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 兌換記錄：每個用戶只能兌換一次
CREATE TABLE IF NOT EXISTS invitation_redemptions (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_redemptions ENABLE ROW LEVEL SECURITY;

-- 已登入用戶可讀取邀請碼（用於驗證）
DROP POLICY IF EXISTS "Authenticated can read invitation_codes" ON invitation_codes;
CREATE POLICY "Authenticated can read invitation_codes"
  ON invitation_codes FOR SELECT
  TO authenticated
  USING (true);

-- 僅 service role 可插入/更新邀請碼（在 Dashboard 或後台手動新增）
-- 前端用 anon key 時無法 insert，所以我們用 database function 來兌換並更新 used_count
DROP POLICY IF EXISTS "Authenticated can update invitation_codes used_count" ON invitation_codes;
CREATE POLICY "Authenticated can update invitation_codes used_count"
  ON invitation_codes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 用戶只能插入自己的兌換記錄
DROP POLICY IF EXISTS "Users can insert own redemption" ON invitation_redemptions;
CREATE POLICY "Users can insert own redemption"
  ON invitation_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own redemption" ON invitation_redemptions;
CREATE POLICY "Users can read own redemption"
  ON invitation_redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 如何新增邀請碼：
-- 方式 1：在 Supabase Dashboard > Table Editor > invitation_codes 中手動新增一列
--   code: 邀請碼字串（例如 NFNJ2025）
--   max_uses: 可使用次數（例如 100）
--   used_count: 保持 0
--
-- 方式 2：在 SQL Editor 執行，例如：
--   INSERT INTO invitation_codes (code, max_uses) VALUES ('NFNJ2025', 100);
--   INSERT INTO invitation_codes (code, max_uses) VALUES ('ELITE-VIP', 50);
