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

### 📊 開發進度
| 階段 | 狀態 | 完成度 |
|------|------|--------|
| 01-基礎系統架構 | ✅ 完成 | 100% |
| 02-即時通訊系統 | ✅ 完成 | 100% |
| 03-YouTube 整合 | 📋 待開發 | 0% |

### ✅ 已完成功能
- Google OAuth 認證
- 樣式管理 (CRUD + 複製 + 預設)
- OBS 透明背景顯示 (`/overlay/:streamerId`)
- Firebase Realtime Database 即時同步
- 測試訊息發送器
- 響應式 UI

### 🎯 下一步
- 開始階段 03: YouTube 單直播整合
- 生產環境 Firestore 索引
- Realtime Database 安全性規則

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