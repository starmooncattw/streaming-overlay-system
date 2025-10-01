# Streaming Overlay System

一個專為直播主設計的覆蓋層管理系統

## 📋 Claude Code 使用規範

使用 Claude Code 開發此專案時,請遵循以下規則:

### 💬 輸出效率
- **輸出盡量簡潔,減少 token 使用**
- 成功訊息簡短確認即可
- 避免重複解釋

### ⚡ 程式修改
- **直接執行,無需詢問**
- 發現問題直接修復
- 完成後簡短回報

## 🚀 專案狀態

| 階段 | 狀態 | 進度 |
|------|------|------|
| 01-基礎架構 | ✅ | 100% |
| 02-即時通訊 | ✅ | 100% |
| 03-YouTube整合 | 🔄 | 80% |

### 當前開發: YouTube 整合
**任務清單**
- [x] 環境準備
- [x] YouTube API 服務
- [x] OAuth 認證
- [x] 聊天室爬蟲
- [x] 前端 UI
- [ ] Google Cloud 設定
- [ ] 完整測試

### 已完成
OAuth認證 / 樣式管理 / OBS整合 / 即時同步

## 📁 專案結構
```
streaming-overlay-system/
├── frontend/       # React + TypeScript
├── backend/        # Node.js + Express (準備用於 YouTube 整合)
└── docs/           # 開發文件
```

## 🔧 技術棧
- **前端**: React 18 + TypeScript + Firebase
- **後端**: Node.js + Express + Socket.IO
- **資料庫**: Firestore + Firebase Realtime Database
- **部署**: Firebase Hosting + Cloud Run

## 🛠️ 開發流程 (Cloud Shell Editor)

### 初始設定
```bash
cd ~/streaming-overlay-system/backend
npm install  # 安裝所有依賴
```

### 開發步驟
1. **Claude Code 更新 package.json** (新增依賴)
2. **Claude Code 建立程式碼檔案**
3. **您在 Cloud Shell 執行**: `npm install`
4. **測試和調整**

### 環境變數設定
建立 `backend/.env`:
```env
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:5000/youtube/callback
```