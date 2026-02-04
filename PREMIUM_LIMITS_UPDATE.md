# Premium 用户限制和优化更新

## ✅ 已完成的更新

### 1. Premium 用户 AI 食物分析限制

**每日限制：13 次**
- Premium 用户：每天最多 13 次 AI 食物分析（图片或文字）
- 免费用户：每天 1 次（保持不变）
- 限制检查在 `checkAiLimit()` 函数中实现
- 配额显示：Premium 用户显示 "X/13 left today"，免费用户显示 "X/1 free left"

**实现位置**：
- `views/FoodTracker.tsx` - `checkAiLimit()` 函数
- `services/databaseService.ts` - `incrementAiUsage()` 函数（支持 Premium 限制）

### 2. Premium 用户身体扫描限制

**每周限制：1 次**
- Premium 用户：每 7 天只能进行一次身体扫描
- 免费用户：无法使用身体扫描功能
- 限制检查在 `checkBodyScanLimit()` 函数中实现
- UI 显示：如果未到时间，显示倒计时和提示信息

**实现位置**：
- `views/Profile.tsx` - `handleBodyScan()` 函数和 UI 状态
- `services/databaseService.ts` - `checkBodyScanLimit()` 函数

### 3. 图片压缩功能

**自动压缩图片**
- 上传图片后自动压缩到 1024x1024 像素
- 压缩质量：80%（0.8）
- 压缩后再发送给 AI 分析，减少 token 使用量（约节省 30-50%）
- 原始图片仍保存在本地用于显示

**实现位置**：
- `services/imageUtils.ts` - `compressImage()` 函数
- `views/FoodTracker.tsx` - `handleFileUpload()` 函数
- `views/Profile.tsx` - `handleBodyScan()` 函数

### 4. 食物分析结果缓存

**智能缓存系统**
- 相同食物（相同图片或相同文字描述）的分析结果会被缓存
- 缓存有效期：7 天
- 使用缓存时不会消耗 AI 配额
- 缓存键生成：
  - 图片：使用 base64 前 100 个字符
  - 文字：标准化后（转小写、去除空格）作为 key

**实现位置**：
- `services/foodCache.ts` - 缓存管理
- `views/FoodTracker.tsx` - 在分析前检查缓存，分析后保存缓存

## 📊 成本优化效果

### 图片压缩
- **压缩前**：约 1,500 tokens/图片
- **压缩后**：约 1,000 tokens/图片
- **节省**：约 33% token 使用量

### 缓存机制
- **重复分析相同食物**：0 tokens（使用缓存）
- **首次分析**：正常 token 消耗
- **预期节省**：如果用户经常重复分析相同食物，可节省 20-40% 成本

### 限制设置
- **Premium 用户**：每天 13 次，每周 1 次身体扫描
- **预期成本**（活跃 Premium 用户）：
  - 食物分析：13 次/天 × 30 天 = 390 次/月
  - 身体扫描：4 次/月
  - 总成本：约 **$0.50-0.60 / 月**（考虑压缩和缓存后）

## 🔧 技术实现细节

### 图片压缩流程
```
用户上传图片
  ↓
compressImage() - 压缩到 1024x1024, quality 0.8
  ↓
getBase64WithoutPrefix() - 提取纯 base64
  ↓
检查缓存
  ↓ (缓存未命中)
调用 AI API（使用压缩后的图片）
  ↓
保存结果到缓存
  ↓
保存到数据库
```

### 缓存流程
```
用户输入（图片或文字）
  ↓
generateCacheKey() - 生成缓存键
  ↓
getCachedFoodResult() - 检查缓存
  ↓
[缓存命中] → 直接返回结果（不消耗配额）
[缓存未命中] → 调用 AI API → 保存到缓存
```

### 限制检查流程
```
用户操作
  ↓
checkAiLimit() / checkBodyScanLimit()
  ↓
检查用户类型（Premium/Free）
  ↓
检查当前使用量 vs 限制
  ↓
[允许] → 继续操作
[拒绝] → 显示提示信息
```

## 📝 数据库更新

### 需要更新的字段
- `profiles.daily_ai_usage` - 已支持 Premium 用户的 13 次限制
- `profiles.last_body_scan_date` - 用于追踪身体扫描时间

### 新增函数
- `checkBodyScanLimit()` - 检查身体扫描限制
- `incrementAiUsage()` - 更新后支持 Premium 限制检查

## 🎯 用户体验改进

1. **更快的响应**：缓存命中时立即返回结果
2. **更低的成本**：图片压缩减少 token 使用
3. **清晰的限制提示**：显示剩余配额和限制说明
4. **智能限制**：Premium 用户有合理的每日/每周限制

## ⚠️ 注意事项

1. **缓存存储**：目前使用内存缓存，刷新页面后会清空。如需持久化，可扩展到 localStorage
2. **图片压缩**：压缩质量设为 0.8，可在 `imageUtils.ts` 中调整
3. **限制检查**：所有限制检查都在前端进行，建议在后端也添加验证以确保安全

## 🚀 下一步优化建议

1. **后端验证**：在 Supabase Edge Functions 中添加限制验证
2. **持久化缓存**：使用 IndexedDB 或 localStorage 保存缓存
3. **批量处理**：对于非实时需求，使用 Batch API（50% 折扣）
4. **监控和告警**：设置成本监控，超过预算时告警
