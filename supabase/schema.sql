-- ============================================
-- NoFap NoJerk Database Schema
-- Supabase PostgreSQL Database Setup
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- ============================================
-- 1. PROFILES TABLE (用户资料表)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'operative',
  avatar_url TEXT DEFAULT 'https://picsum.photos/seed/warrior/150/150',
  bio TEXT DEFAULT 'initializing protocol...',
  streak INTEGER DEFAULT 0,
  relapse_count INTEGER DEFAULT 0,
  journey_start_date TIMESTAMPTZ,
  weight NUMERIC DEFAULT 75,
  height NUMERIC DEFAULT 180,
  is_premium BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'zh')),
  preferences JSONB DEFAULT '{"stealthMode": false, "showStreakOnPlaza": true, "notificationsEnabled": true}'::jsonb,
  nutrition_goals JSONB DEFAULT '{"calories": 2500, "protein": 150, "carbs": 250, "fats": 70}'::jsonb,
  daily_ai_usage JSONB DEFAULT '{"date": "", "count": 0}'::jsonb,
  last_post_date DATE,
  last_comment_reset DATE,
  last_body_scan_date TIMESTAMPTZ,
  comments_today_count INTEGER DEFAULT 0,
  body_scan_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CHECK_INS TABLE (签到记录表)
-- ============================================
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('check', 'reset')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================
-- 3. FOOD_ENTRIES TABLE (食物记录表)
-- ============================================
CREATE TABLE IF NOT EXISTS food_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fats NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TASKS TABLE (任务表)
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. POSTS TABLE (帖子表)
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'grow' CHECK (category IN ('grow', 'help', 'sports', 'music', 'meditation')),
  likes INTEGER DEFAULT 0,
  streak_at_time INTEGER,
  season_at_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. COMMENTS TABLE (评论表)
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. REPORTS TABLE (問題回報表 - 介面內留言給後台)
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES (索引优化)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON check_ins(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_food_entries_user_timestamp ON food_entries(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_created ON tasks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_created ON reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

-- ============================================
-- FUNCTIONS (数据库函数)
-- ============================================

-- Function: 自动创建用户profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, journey_start_date)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'operative'),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: 更新profile的updated_at时间戳
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: 计算并更新streak
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  current_streak INTEGER;
  check_count INTEGER;
BEGIN
  -- 计算当前streak（连续check的天数）
  SELECT COUNT(*) INTO check_count
  FROM check_ins
  WHERE user_id = NEW.user_id
    AND status = 'check'
    AND date >= (
      SELECT COALESCE(MAX(date), '1970-01-01'::date)
      FROM check_ins
      WHERE user_id = NEW.user_id AND status = 'reset'
    );
  
  -- 更新profile的streak
  UPDATE profiles
  SET streak = check_count
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: 更新relapse_count
CREATE OR REPLACE FUNCTION public.update_relapse_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'reset' THEN
    UPDATE profiles
    SET relapse_count = (
      SELECT COUNT(*)
      FROM check_ins
      WHERE user_id = NEW.user_id AND status = 'reset'
    )
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: 重置每日评论计数（每天凌晨）
CREATE OR REPLACE FUNCTION public.reset_daily_comment_count()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET comments_today_count = 0,
      last_comment_reset = CURRENT_DATE
  WHERE last_comment_reset IS NULL OR last_comment_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: 重置每日AI使用计数
CREATE OR REPLACE FUNCTION public.reset_daily_ai_usage()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET daily_ai_usage = jsonb_build_object(
    'date', CURRENT_DATE::text,
    'count', 0
  )
  WHERE (daily_ai_usage->>'date')::date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS (触发器)
-- ============================================

-- Trigger: 新用户注册时自动创建profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: 更新profile的updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: 更新streak
DROP TRIGGER IF EXISTS update_streak_on_check_in ON check_ins;
CREATE TRIGGER update_streak_on_check_in
  AFTER INSERT OR UPDATE ON check_ins
  FOR EACH ROW EXECUTE FUNCTION public.update_user_streak();

-- Trigger: 更新relapse_count
DROP TRIGGER IF EXISTS update_relapse_on_check_in ON check_ins;
CREATE TRIGGER update_relapse_on_check_in
  AFTER INSERT OR UPDATE ON check_ins
  FOR EACH ROW EXECUTE FUNCTION public.update_relapse_count();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view other profiles" ON profiles;
CREATE POLICY "Users can view other profiles"
  ON profiles FOR SELECT
  USING (true); -- 允许查看其他用户的基本信息（用于Plaza显示）

-- Check-ins Policies
DROP POLICY IF EXISTS "Users can manage own check-ins" ON check_ins;
CREATE POLICY "Users can manage own check-ins"
  ON check_ins FOR ALL
  USING (auth.uid() = user_id);

-- Food Entries Policies
DROP POLICY IF EXISTS "Users can manage own food entries" ON food_entries;
CREATE POLICY "Users can manage own food entries"
  ON food_entries FOR ALL
  USING (auth.uid() = user_id);

-- Tasks Policies
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL
  USING (auth.uid() = user_id);

-- Posts Policies
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create own posts" ON posts;
CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- Comments Policies
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create own comments" ON comments;
CREATE POLICY "Users can create own comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Reports Policies (users can only insert; backend reads via service role)
DROP POLICY IF EXISTS "Users can submit own reports" ON reports;
CREATE POLICY "Users can submit own reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- GRANTS (权限授予)
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
