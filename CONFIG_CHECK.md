# 配置检查指南

## 📋 当前配置状态

根据检查，您的 `.env.local` 文件目前还包含占位符值，需要填入实际配置。

## ✅ 配置检查清单

### 1. Supabase 配置

**VITE_SUPABASE_URL**
- ✅ 格式：`https://xxxxx.supabase.co`
- ✅ 必须以 `https://` 开头
- ✅ 必须包含 `.supabase.co`
- 📍 获取位置：Supabase Dashboard > Settings > API > Project URL

**VITE_SUPABASE_ANON_KEY**
- ✅ 格式：以 `eyJ` 开头的长字符串
- ✅ 长度：通常 200+ 字符
- 📍 获取位置：Supabase Dashboard > Settings > API > anon public key

### 2. Gemini AI 配置

**VITE_GEMINI_API_KEY**
- ✅ 格式：Google API Key 字符串
- ✅ 长度：通常 30+ 字符
- 📍 获取位置：https://aistudio.google.com/

## 🔍 手动检查步骤

### 步骤 1：打开 .env.local 文件
```
/Users/poonrealiam/Desktop/My 1st NFNJ app/nofap-nojerk-extracted/.env.local
```

### 步骤 2：检查每个变量

确保以下变量都已填入实际值（不是占位符）：

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co  ← 需要替换
VITE_SUPABASE_ANON_KEY=your-anon-key-here              ← 需要替换
VITE_GEMINI_API_KEY=your-gemini-api-key-here           ← 需要替换
```

### 步骤 3：验证格式

**VITE_SUPABASE_URL 应该类似：**
```
https://abcdefghijklmnop.supabase.co
```

**VITE_SUPABASE_ANON_KEY 应该类似：**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**VITE_GEMINI_API_KEY 应该类似：**
```
AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
```

## 🧪 测试配置

### 方法 1：运行检查脚本（如果已安装 Node.js）
```bash
node check-config.js
```

### 方法 2：启动开发服务器测试
```bash
npm run dev
```

如果配置正确：
- ✅ 应用正常启动
- ✅ 浏览器控制台没有 Supabase 配置错误
- ✅ 可以尝试登录/注册

如果配置有问题：
- ❌ 浏览器控制台会显示 "Supabase configuration missing"
- ❌ 应用会运行在离线模式（Mock Mode）

## 📝 配置完成后

1. ✅ 保存 `.env.local` 文件
2. ✅ 重启开发服务器（如果正在运行）
3. ✅ 测试登录功能
4. ✅ 检查浏览器控制台是否有错误

## 🆘 常见问题

### Q: 如何知道配置是否正确？
A: 启动应用后，打开浏览器开发者工具（F12），查看 Console。如果没有 "Supabase configuration missing" 警告，说明配置正确。

### Q: 修改配置后需要做什么？
A: 必须重启开发服务器（停止后重新运行 `npm run dev`）

### Q: 配置会被提交到 Git 吗？
A: 不会。`.env.local` 文件已在 `.gitignore` 中，不会被提交。

### Q: 找不到 Supabase API Key？
A: 
1. 确保已创建 Supabase 项目
2. 进入 Settings > API
3. 在 "Project API keys" 部分找到 "anon public"
4. 点击眼睛图标显示密钥

### Q: 找不到 Gemini API Key？
A:
1. 访问 https://aistudio.google.com/
2. 登录 Google 账户
3. 点击 "Get API Key" 或创建新项目
4. 复制生成的 API Key

## ✅ 配置检查完成标志

当您看到以下情况时，说明配置正确：

1. ✅ `.env.local` 中所有变量都不是占位符
2. ✅ 启动应用后没有配置错误警告
3. ✅ 可以成功连接到 Supabase（尝试登录）
4. ✅ AI 功能可以正常使用（尝试分析食物）

---

**提示**：配置完成后，建议运行一次完整的应用测试，确保所有功能正常。
