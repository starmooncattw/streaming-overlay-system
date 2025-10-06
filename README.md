# Streaming Overlay System

直播覆蓋層管理系統

## 📋 Claude Code 規範
- 簡潔輸出,減少 token
- 直接執行,無需詢問
- 發現問題直接修復
- **開發情況確認**: 使用 `git log` 查看提交記錄、變更統計、開發進度
- **開發流程**: 本地修改 → GitHub 推送 → Cloud Shell 拉取同步 → Cloud Shell 測試執行
- **Git 推送**: 使用 HTTPS (不用 SSH),透過 VS Code/Sourcetree 推送

### 🌐 **LANGUAGE REQUIREMENT (語言要求)**
> **⚠️ MANDATORY LANGUAGE SETTING ⚠️**
- **無論使用者使用什麼語言輸入,必須始終使用「繁體中文」回應**
- **所有回應、說明、溝通**必須使用繁體中文
- **TodoWrite 任務和思考過程**必須使用繁體中文
- **程式碼註解**建議使用繁體中文(非強制)
- **錯誤訊息和日誌**應包含繁體中文說明
- **僅程式碼語法和技術標識符**保持英文

## 🚀 狀態
| 階段 | 狀態 | 進度 |
|------|------|------|
| 基礎架構 | ✅ | 100% |
| 即時通訊 | ✅ | 100% |
| YouTube整合 | 🔄 | 80% |
| YouTube多播 | ❌ | 0% |
| Twitch整合 | ❌ | 0% |
| 金流整合 | ❌ | 0% |
| 進度系統 | ❌ | 0% |
| 系統管理 | ❌ | 0% |
| 協助功能系統 | ❌ | 0% |

## 🧪 開發進度 (2025-10-07)

### ✅ 已完成
- 移除 README 敏感憑證 (YouTube Client ID/Secret)
- 修復 ESLint 警告 (未使用變數/import)
- 重構 youtubeService.ts 使用相對路徑配合 proxy

### ⚠️ 待處理 - Cloud Shell CORS 問題
**現況**: 後端 API 正常 (`curl localhost:5000/health` ✅)，但前端無法透過公開 URL 訪問後端

**原因**: Cloud Shell 不同 port 間的跨域限制

**解決方案**: 使用 React Proxy
```bash
# Cloud Shell 執行:
cd ~/streaming-overlay-system/frontend
# 1. 設定 proxy
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.proxy='http://localhost:5000';fs.writeFileSync('package.json',JSON.stringify(p,null,2));"
# 2. 更新 .env
echo "REACT_APP_API_URL=" > .env
cat .env.example | grep FIREBASE >> .env
# 3. 重啟
pkill -f react-scripts && rm -rf .cache node_modules/.cache
PORT=3001 nohup npm start > frontend.log 2>&1 &
```

### 📝 本次變更
- `frontend/src/services/youtubeService.ts` - 已改用 axios 實例 + 相對路徑
- 本機修改完成，稍後統一推送 GitHub

### 🔑 環境設定
**本機**: 無 `.env` 檔案 (僅 `.env.example`)
**Cloud Shell**: 已設定完整 `.env` (backend/frontend 皆有)

參考 `.env.example` 設定環境變數

## 🔧 技術棧
- React 18 + TypeScript + Firebase
- Node.js + Express + Socket.IO
- Firestore + Realtime Database
