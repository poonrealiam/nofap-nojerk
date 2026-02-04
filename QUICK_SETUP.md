# 🚀 快速设置 Supabase（5分钟完成）

## ⚠️ 当前问题
应用显示 "Supabase 配置错误"，需要完成以下步骤：

## 📋 步骤清单

### ✅ 步骤 1：创建 Supabase 项目（2分钟）

1. **访问 Supabase**
   - 打开 https://supabase.com
   - 点击 "Start your project" 或 "Sign in"

2. **创建新项目**
   - 点击 "New Project"
   - 填写信息：
     - **Name**: `nofap-nojerk`（或任意名称）
     - **Database Password**: 设置一个强密码（**请记住这个密码！**）
     - **Region**: 选择离您最近的区域（如 `Southeast Asia (Singapore)`）
   - 点击 "Create new project"
   - ⏳ 等待 2-3 分钟项目创建完成

### ✅ 步骤 2：运行数据库 Schema（1分钟）

1. **打开 SQL Editor**
   - 在 Supabase Dashboard 左侧菜单
   - 点击 **SQL Editor**

2. **运行 Schema**
   - 点击 **New Query**
   - 打开项目中的 `supabase/schema.sql` 文件
   - **复制全部内容**（333行）
   - 粘贴到 SQL Editor
   - 点击 **Run**（或按 Cmd+Enter）
   - ✅ 应该看到 "Success. No rows returned"

### ✅ 步骤 3：获取 API 密钥（1分钟）

1. **进入 Settings**
   - 左侧菜单点击 **Settings**（齿轮图标）
   - 点击 **API**

2. **复制配置信息**
   - **Project URL**: 复制 `https://xxxxx.supabase.co` 这个地址
   - **anon public key**: 在 "Project API keys" 部分，找到 **anon public**
     - 点击眼睛图标 👁️ 显示密钥
     - 复制整个密钥（以 `eyJ` 开头，很长的一串）

### ✅ 步骤 4：配置环境变量（1分钟）

1. **打开 `.env.local` 文件**
   - 路径：`/Users/poonrealiam/Desktop/My 1st NFNJ app/nofap-nojerk-extracted/.env.local`

2. **替换占位符**
   
   找到这两行：
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   
   替换为您的实际值：
   ```env
   VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

   **重要**：
   - `VITE_SUPABASE_URL` 必须以 `https://` 开头
   - `VITE_SUPABASE_ANON_KEY` 必须以 `eyJ` 开头
   - 不要有多余的空格或引号

3. **保存文件**

### ✅ 步骤 5：关闭 Email 确认（开发测试，30秒）

1. **进入 Authentication**
   - 左侧菜单点击 **Authentication**
   - 点击 **Providers**

2. **配置 Email**
   - 找到 **Email** 提供商
   - 确保已启用（开关为 ON）
   - 点击 **Email** 进入详细设置
   - 找到 **"Confirm email"** 选项
   - **关闭它**（设为 OFF）✅
   - 点击 **Save**

   **为什么关闭？** 这样注册后可以直接登录，无需验证邮箱，方便测试。

### ✅ 步骤 6：重启开发服务器

1. **停止当前服务器**
   - 在终端按 `Ctrl + C`

2. **重新启动**
   ```bash
   npm run dev
   ```

3. **刷新浏览器**
   - 访问 `http://localhost:3000`
   - 按 `Cmd + Shift + R` 强制刷新

## ✅ 验证配置

配置成功后，您应该：

1. ✅ **不再看到错误对话框**
2. ✅ **可以点击 "Sign Up" 注册**
3. ✅ **输入邮箱后可以成功注册**
4. ✅ **注册后可以直接登录**（如果关闭了 Email 确认）

## 🐛 如果还有问题

### 检查清单：

- [ ] Supabase 项目已创建并运行
- [ ] `schema.sql` 已成功运行（没有错误）
- [ ] `.env.local` 中的 URL 和 Key 已替换为实际值
- [ ] URL 以 `https://` 开头
- [ ] Key 以 `eyJ` 开头
- [ ] 已重启开发服务器
- [ ] 浏览器已刷新

### 查看错误信息：

1. **打开浏览器开发者工具**
   - 按 `F12` 或 `Cmd + Option + I`

2. **查看 Console 标签**
   - 查看是否有红色错误信息
   - 错误信息会告诉您具体问题

3. **常见错误**：
   - `Invalid API key` → Key 不正确
   - `Failed to fetch` → URL 不正确或网络问题
   - `relation "profiles" does not exist` → schema.sql 未运行

## 📞 需要帮助？

如果按照以上步骤操作后仍有问题，请提供：
1. 浏览器 Console 中的错误信息（截图）
2. `.env.local` 文件的前几行（隐藏实际密钥，只显示格式）
3. Supabase Dashboard 中是否看到 "profiles" 表（Table Editor）

---

**预计完成时间**：5-10 分钟

**完成后**：您就可以注册账户并开始测试应用了！🎉
