# Supabase 数据库设置指南

本指南将帮助您设置 Supabase 数据库并配置前后端连接。

## 📋 前置要求

1. 一个 Supabase 账户（免费账户即可）
2. 访问 [https://supabase.com](https://supabase.com)

## 🚀 步骤 1: 创建 Supabase 项目

1. 登录 Supabase Dashboard
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: nofap-nojerk
   - **Database Password**: 设置一个强密码（请保存好）
   - **Region**: 选择离您最近的区域
4. 等待项目创建完成（约 2 分钟）

## 🔧 步骤 2: 运行数据库 Schema

1. 在 Supabase Dashboard 中，进入 **SQL Editor**
2. 点击 **New Query**
3. 复制 `schema.sql` 文件的全部内容
4. 粘贴到 SQL Editor 中
5. 点击 **Run** 执行 SQL
6. 确认所有表、函数、触发器和策略都已创建成功

## 🔑 步骤 3: 获取 API 密钥

1. 在 Supabase Dashboard 中，进入 **Settings** > **API**
2. 找到以下信息：
   - **Project URL** (例如: `https://xxxxx.supabase.co`)
   - **anon public** key (以 `eyJ...` 开头)
3. 复制这两个值，稍后需要用到

## 🔐 步骤 4: 配置认证

1. 在 Supabase Dashboard 中，进入 **Authentication** > **Providers**
2. 确保 **Email** 提供商已启用
3. 配置 Email 设置：
   - **Enable Email provider**: ON
   - **Confirm email**: OFF (开发环境可以关闭，生产环境建议开启)
   - **Secure email change**: ON

## 📝 步骤 5: 配置环境变量

在项目根目录创建或更新 `.env.local` 文件：

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here
```

**重要**: 
- 将 `your-project-id` 替换为您的实际项目 ID
- 将 `your-anon-key-here` 替换为您的实际 anon key
- 将 `your-gemini-api-key-here` 替换为您的 Gemini API 密钥

## ✅ 步骤 6: 验证设置

运行以下命令验证数据库连接：

```bash
npm run dev
```

访问应用并尝试注册/登录，如果一切正常，您应该能够：
- 创建账户
- 登录
- 查看 Dashboard
- 创建 Check-in 记录

## 🔄 步骤 7: 设置定时任务（可选）

为了自动重置每日评论计数和 AI 使用计数，您需要设置 Supabase Cron Jobs：

1. 在 Supabase Dashboard 中，进入 **Database** > **Extensions**
2. 启用 `pg_cron` 扩展
3. 在 SQL Editor 中运行：

```sql
-- 每天凌晨重置评论计数
SELECT cron.schedule(
  'reset-daily-comments',
  '0 0 * * *',
  $$SELECT public.reset_daily_comment_count();$$
);

-- 每天凌晨重置AI使用计数
SELECT cron.schedule(
  'reset-daily-ai-usage',
  '0 0 * * *',
  $$SELECT public.reset_daily_ai_usage();$$
);
```

## 📊 数据库结构概览

### 表结构

1. **profiles** - 用户资料
2. **check_ins** - 签到记录
3. **food_entries** - 食物记录
4. **tasks** - 任务列表
5. **posts** - 社区帖子
6. **comments** - 评论

### 自动功能

- ✅ 新用户注册时自动创建 profile
- ✅ Check-in 时自动更新 streak
- ✅ Reset 时自动更新 relapse_count
- ✅ 自动更新时间戳

## 🛠️ 故障排除

### 问题：无法连接 Supabase

**解决方案**:
- 检查 `.env.local` 文件中的 URL 和 Key 是否正确
- 确认 Supabase 项目状态为 "Active"
- 检查网络连接

### 问题：RLS 策略阻止访问

**解决方案**:
- 确认已登录用户（检查 `auth.uid()`）
- 检查 RLS 策略是否正确创建
- 查看 Supabase Dashboard 中的 Logs

### 问题：触发器不工作

**解决方案**:
- 确认所有函数都已创建
- 检查触发器是否正确附加
- 查看 Supabase Dashboard 中的 Database Logs

## 📚 更多资源

- [Supabase 文档](https://supabase.com/docs)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Row Level Security 指南](https://supabase.com/docs/guides/auth/row-level-security)
