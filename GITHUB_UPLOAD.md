# 上傳到 GitHub

本專案已初始化 Git 並完成首次提交（分支 `main`）。

## 上傳步驟

### 1. 在 GitHub 建立新倉庫

1. 登入 [github.com](https://github.com)
2. 點右上角 **+** → **New repository**
3. 填寫：
   - **Repository name**：例如 `nofap-nojerk-app` 或 `my-nfnj-app`
   - **Visibility**：選 Public 或 Private
   - **不要**勾選 "Add a README" / "Add .gitignore"（專案已有）
4. 點 **Create repository**

### 2. 在終端機執行（把 `你的用戶名` 和 `倉庫名` 換成你的）

```bash
cd "/Users/poonrealiam/Desktop/My 1st NFNJ app/nofap-nojerk-extracted"

git remote add origin https://github.com/你的用戶名/倉庫名.git
git push -u origin main
```

若使用 SSH：

```bash
git remote add origin git@github.com:你的用戶名/倉庫名.git
git push -u origin main
```

### 3. 若 GitHub 要求登入

- **HTTPS**：會要求 GitHub 用戶名 + Personal Access Token（不是密碼）
- **SSH**：需先在 GitHub 設定 SSH key

建立 Token：GitHub → Settings → Developer settings → Personal access tokens → Generate new token，勾選 `repo` 權限。

---

**注意**：`.env.local` 已列入 `.gitignore`，不會被上傳，請勿刪除該設定。
