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

## 🧪 開發進度 (2025-10-13)

### ✅ 已完成
- 修復 YouTube OAuth `invalid_grant` 錯誤（React 嚴格模式重複呼叫）
- Cloud Shell CORS 問題已解決（React Proxy）
- YouTube 授權流程測試通過

### 📍 當前狀態
**Commit**: `f87a798` - 修復 OAuth 授權碼重複使用
**待推送**: 本地已 commit，需透過 VS Code/Sourcetree 推送

### 🔧 Cloud Shell 部署
```bash
# 1. 同步代碼
cd ~/streaming-overlay-system && git pull

# 2. 後端 (port 5000)
cd backend
YOUTUBE_REDIRECT_URI=https://3001-cs-xxx.cloudshell.dev/youtube/connect
pkill -f server.js && nohup node src/server.js > backend.log 2>&1 &

# 3. 前端 (port 3001)
cd frontend
pkill -f react-scripts && rm -rf .cache node_modules/.cache
PORT=3001 nohup npm start > frontend.log 2>&1 &
```

### 🔑 環境設定
**Google OAuth 重定向 URI**:
- `https://3001-cs-xxx.cloudshell.dev/youtube/connect`
- 需在後端 `.env` 設定 `YOUTUBE_REDIRECT_URI`
- Cloud Shell URL 重啟後會變更

## 🔧 技術棧
- React 18 + TypeScript + Firebase
- Node.js + Express + Socket.IO
- Firestore + Realtime Database

