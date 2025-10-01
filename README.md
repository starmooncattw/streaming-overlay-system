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

## 🚀 目前狀態 (v1.0-MVP 完成)

### ✅ 核心功能 (MVP)
**基礎系統架構 (01-basic-system-architecture.md) - 100% 完成**
- ✅ Google OAuth 認證系統
- ✅ 用戶資料自動建立與管理
- ✅ 樣式管理系統 (CRUD 完整功能)
  - 建立、讀取、更新、刪除樣式
  - 複製樣式功能
  - 預設樣式設定
- ✅ OBS 整合功能
  - 透明背景顯示頁面 (`/overlay/:streamerId`)
  - 樣式參數動態載入
  - OBS 網址生成與複製
- ✅ 測試訊息發送器
  - 手動發送測試訊息
  - 隨機訊息生成
  - 預設訊息快速選擇
- ✅ Firebase Realtime Database 即時訊息同步
- ✅ React 路由與受保護路由
- ✅ 響應式 UI 設計

### 🎨 使用者介面
- ✅ 登入頁面 (Google OAuth)
- ✅ 主控台儀表板
- ✅ 樣式管理頁面
- ✅ 測試訊息頁面
- ✅ OBS 顯示頁面 (透明背景)
- ✅ 導航列與用戶資訊顯示

### 🔧 最新修復
- 移除不必要的 OBS 設定分頁 (功能已整合至測試訊息頁面)
- 解決 TypeScript 編譯錯誤
- 修復 React Hook 條件調用錯誤
- 設定 Firebase Realtime Database（新加坡區域）

### 🧪 測試狀態
- ✅ Google 認證功能正常
- ✅ 樣式 CRUD 操作正常
- ✅ OBS 透明背景顯示正常
- ✅ 測試訊息即時同步正常
- ✅ Firebase Realtime Database 連接正常
- ⚠️ Firestore 查詢已簡化（生產環境需要索引）

### 🎯 下一步計劃
**基礎架構已完成，準備進入第二階段**
1. 實作即時通訊系統 (02-real-time-messaging.md)
2. 為生產環境建立 Firestore 索引
3. 優化 Realtime Database 安全性規則
4. 整合外部聊天平台 (YouTube/Twitch)

## 技術債務

### 資料庫
- 生產環境需要 Firestore 複合索引
- 暫時實現客戶端排序作為替代方案
- Realtime Database 目前使用測試模式規則（需在 30 天內更新為正式規則）

### 認證
- 使用開發版 Firebase 配置
- 可能需要生產環境變數

### 錯誤處理
- 部分非關鍵錯誤在開發階段被忽略
- WebSocket 連接錯誤可以忽略（非核心功能）

## 開發環境設置

### 前置需求
- Node.js 18.x 或更高版本
- npm 9.x 或更高版本