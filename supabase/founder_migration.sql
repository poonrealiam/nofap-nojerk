-- Founder flag: 創始人在廣場顯示不同、且不受發文/留言/AI 分析限制
-- Run in Supabase SQL Editor.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_founder BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.profiles.is_founder IS '創始人：廣場顯示盾牌/綠色名字，且不受發文、留言、AI 分析次數限制。';

-- 將指定用戶設為創始人（把 'YOUR-USER-UUID' 換成實際的 auth.users id）：
-- UPDATE public.profiles SET is_founder = true WHERE id = 'YOUR-USER-UUID';
