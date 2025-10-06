# Streaming Overlay System

直播覆蓋層管理系統

## 📋 Claude Code 規範
- 簡潔輸出,減少 token
- 直接執行,無需詢問
- 發現問題直接修復
- **開發情況確認**: 使用 `git log` 查看提交記錄、變更統計、開發進度
- **開發流程**: 本地修改 → GitHub 推送 → Cloud Shell 拉取同步 → Cloud Shell 測試執行

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

## 🧪 測試狀態 (2025-01-05)

### ✅ 已完成
- YouTube OAuth 憑證建立
- Cloud Shell 服務部署 (前端 3001, 後端 5000)
- 環境變數設定完成
- TypeScript 錯誤修復

### ⚠️ 待解決
**問題**: 前端快取未更新，仍請求 `localhost:5000`
**解決方案**:
```bash
cd ~/streaming-overlay-system/frontend
pkill -f react-scripts && rm -rf .cache node_modules/.cache
nohup npm start > frontend.log 2>&1 &
# 瀏覽器: F12 > Application > Clear storage
```

### 🔑 關鍵設定檔
**backend/.env**:
```
YOUTUBE_CLIENT_ID=你的_CLIENT_ID
YOUTUBE_CLIENT_SECRET=你的_CLIENT_SECRET
YOUTUBE_REDIRECT_URI=你的_REDIRECT_URI
FRONTEND_URL=你的_FRONTEND_URL
```

**frontend/.env**:
```
REACT_APP_API_URL=你的_API_URL
```

💡 **注意**: 請參考 `.env.example` 檔案設定實際的環境變數

## 🔧 技術棧
- React 18 + TypeScript + Firebase
- Node.js + Express + Socket.IO
- Firestore + Realtime Database
