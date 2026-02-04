# 测试模式使用指南

## 🚀 快速开始测试

### 步骤 1：配置 Supabase（必需）

在测试之前，您需要先设置 Supabase：

1. **创建 Supabase 项目**
   - 访问 https://supabase.com
   - 创建新项目（免费账户即可）

2. **运行数据库 Schema**
   - 在 Supabase Dashboard > SQL Editor
   - 运行 `supabase/schema.sql` 文件中的所有 SQL

3. **获取 API 密钥**
   - Settings > API
   - 复制 Project URL 和 anon public key

4. **配置环境变量**
   - 编辑 `.env.local` 文件
   - 填入 Supabase URL 和 Key

### 步骤 2：配置 Supabase Email 设置（重要！）

为了让注册流程正常工作，需要配置 Email 提供商：

1. 进入 **Authentication** > **Providers**
2. 确保 **Email** 已启用
3. 进入 **Email Templates** 或 **Settings**
4. **重要设置**：
   - **Enable Email provider**: ✅ ON
   - **Confirm email**: ⚠️ 开发环境建议设为 **OFF**（这样不需要验证邮箱即可登录）
   - **Secure email change**: ✅ ON

### 步骤 3：注册新账户

1. **打开应用**：`http://localhost:3000`
2. **点击 "Sign Up" 按钮**（右侧按钮）
3. **输入您的邮箱**：例如 `your-email@example.com`
4. **点击 "Activate Profile"**
5. **检查邮箱**：
   - 如果 Email 确认已关闭：可以直接登录
   - 如果 Email 确认已开启：点击邮箱中的验证链接

## 🔧 开发模式（跳过邮箱验证）

如果您想在开发时跳过邮箱验证，可以：

### 方法 1：关闭 Email 确认（推荐用于开发）

在 Supabase Dashboard：
1. **Authentication** > **Providers** > **Email**
2. 将 **"Confirm email"** 设置为 **OFF**
3. 这样注册后可以直接登录，无需验证邮箱

### 方法 2：使用测试邮箱

Supabase 提供测试模式，但需要配置。最简单的方法是关闭 Email 确认。

## 📧 邮箱验证流程

如果 Email 确认已开启：

1. **注册时**：Supabase 会发送验证邮件
2. **点击邮件中的链接**：会自动验证并登录
3. **如果没收到邮件**：
   - 检查垃圾邮件文件夹
   - 检查 Supabase Dashboard > Authentication > Users 查看是否发送成功
   - 可以手动重发验证邮件

## 🐛 常见问题

### 问题：点击注册后没有反应

**可能原因**：
1. Supabase 配置错误（检查 `.env.local`）
2. 网络连接问题
3. Supabase 项目未创建

**解决方法**：
- 打开浏览器开发者工具（F12）> Console
- 查看错误信息
- 确认 Supabase URL 和 Key 正确

### 问题：收到 "Invalid API key" 错误

**解决方法**：
- 检查 `.env.local` 中的 `VITE_SUPABASE_ANON_KEY` 是否正确
- 确保复制了完整的 key（以 `eyJ` 开头）
- 重启开发服务器

### 问题：注册后无法登录

**解决方法**：
1. 检查 Supabase Dashboard > Authentication > Users
2. 确认用户已创建
3. 如果 Email 确认开启，需要点击验证链接
4. 如果 Email 确认关闭，应该可以直接登录

### 问题：找不到验证邮件

**解决方法**：
1. 检查垃圾邮件文件夹
2. 在 Supabase Dashboard > Authentication > Users 中查看用户状态
3. 可以手动重发验证邮件
4. **开发建议**：关闭 Email 确认以简化测试流程

## ✅ 测试检查清单

- [ ] Supabase 项目已创建
- [ ] `schema.sql` 已运行
- [ ] `.env.local` 已配置 Supabase URL 和 Key
- [ ] Email 提供商已启用
- [ ] Email 确认设置已配置（开发环境建议关闭）
- [ ] 开发服务器正在运行
- [ ] 可以访问 `http://localhost:3000`
- [ ] 可以成功注册新账户
- [ ] 可以成功登录

## 🎯 下一步

注册并登录成功后，您可以：
1. 测试 Check-in 功能
2. 添加食物记录
3. 创建任务
4. 发布帖子
5. 测试所有功能

---

**提示**：如果遇到任何问题，检查浏览器控制台（F12）的错误信息，这通常能帮助快速定位问题。
