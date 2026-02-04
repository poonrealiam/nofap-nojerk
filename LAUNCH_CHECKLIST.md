# 上線營收準備清單

正式對外上線、開始收費前，請依序確認以下項目。

---

## 一、正式環境與機密

- [ ] **Supabase 正式專案**  
  - 若目前用同一個專案開發，可繼續用；若要分開，請在 Supabase 另建 Production 專案，並在該專案執行 `supabase/schema.sql`。
- [ ] **正式環境變數**  
  部署平台（Vercel / Netlify / 自有主機等）需設定：
  - `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`（正式 Supabase）
  - `VITE_GEMINI_API_KEY`（正式 Gemini Key）
  - 金流變數見下方「金流」。
- [ ] **不要提交機密**  
  確認 `.env.local`、`.env` 已在 `.gitignore`，且從未把真實 Key 推上 Git。若曾誤傳，到 Supabase / Google Cloud 重發 Key 並更新環境變數。

---

## 二、金流上線（才能真的收錢）

### 1. App Store（蘋果）

- [ ] 在 App Store Connect 建立 App、訂閱產品（月付 $9.9 / 年付 $99 或你定的價）。
- [ ] 在 `.env` 或部署平台設定其一：
  - `VITE_APP_STORE_URL=https://apps.apple.com/app/id你的AppID`
  - 或 `VITE_APP_STORE_APP_ID=你的AppID`
- [ ] 用戶點「Apple 訂閱」會跳轉 App Store，在 App 內完成購買與扣款。

### 2. Google Play

- [ ] 在 Google Play Console 建立應用與訂閱商品（月付 / 年付）。
- [ ] 設定其一：
  - `VITE_GOOGLE_PLAY_URL=https://play.google.com/store/apps/details?id=你的套件名`
  - 或 `VITE_GOOGLE_PLAY_PACKAGE=你的套件名`
- [ ] 用戶點「Play 商店」會跳轉 Google Play 完成訂閱。

### 3. Stripe（直連 / 大陸或網頁用戶）

- [ ] 在 Stripe Dashboard 建立 **正式** Recurring Payment Links（月 $9.9、年 $99）。
- [ ] 設定：
  - `VITE_STRIPE_MONTHLY_LINK=https://buy.stripe.com/xxxxx`
  - `VITE_STRIPE_ANNUAL_LINK=https://buy.stripe.com/xxxxx`
- [ ] 訂閱成功後，需在後台或 Webhook 把該用戶標記為 Premium（與你現有 `subscription_status` / 權限邏輯對接）。

---

## 三、建置與部署

- [ ] 本地先跑一次正式建置：  
  `npm run build`  
  確認無錯誤且 `dist/` 可正常開啟。
- [ ] 將專案部署到正式網址（如 Vercel / Netlify），並在該平台設定上述所有 `VITE_*` 環境變數。
- [ ] 用無痕視窗測試：註冊、登入、打勾、訂閱頁跳轉（Apple / Google / Stripe）是否正確。

---

## 四、上架與合規（避免被下架、爭議）

- [ ] **隱私政策 / 條款**  
  若有「訂閱將依所選方案自動續費扣款」等說明，建議同時提供完整隱私政策與訂閱/退款條款連結（可放在設定頁或訂閱頁）。
- [ ] **定價與幣別**  
  介面與商店內定價一致（例如月 $9.9、年 $99），幣別與當地顯示清楚。
- [ ] **取消與退款**  
  Apple / Google 依商店政策；Stripe 依你設定的退款規則。建議在說明中寫明「如何取消訂閱」。

---

## 五、上線後建議

- [ ] 監控 Supabase 用量與費用（Database、Auth、Storage）。
- [ ] 監控 Gemini API 用量與費用（AI 食物分析、身體掃描等）。
- [ ] 若有 Stripe，在 Dashboard 開 Webhook 並處理 `customer.subscription.updated` / `deleted`，同步更新你資料庫的 Premium 狀態。

---

完成上述項目後，就可以對外開放並開始收費。之後若有改版或新付費管道，再回來補勾選即可。
