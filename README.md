# 🎥 直播主 OBS 資訊顯示系統

專為直播主設計的 OBS 整合資訊顯示系統，支援聊天室整合、斗內進度追蹤等多功能顯示。

## 🚀 快速開始

### 前置需求
- Node.js 18+ 
- npm 或 yarn
- Docker (可選)

### 本地開發

1. **Clone 專案**
```bash
git clone https://github.com/yourusername/streaming-overlay-system.git
cd streaming-overlay-system
```

2. **設定環境變數**
```bash
cp .env.example .env
# 編輯 .env 填入必要的設定
```

3. **安裝依賴**
```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install
```

4. **啟動開發服務**
```bash
# 啟動後端 (Port 3001)
cd backend
npm run dev

# 啟動前端 (Port 3000)
cd ../frontend  
npm start
```

### Docker 開發 (可選)
```bash
docker-compose up -d
```

## 📁 專案結構

```
streaming-overlay-system/
├── frontend/           # React + TypeScript 前端
├── backend/           # Node.js + Express 後端
├── docs/             # 文件
├── docker-compose.yml # Docker 設定
└── README.md
```

## 🎯 功能特色

### 第一階段 - 聊天室顯示系統
- ✅ Google 登入認證
- ✅ 多樣式聊天室顯示
- ✅ OBS 透明背景整合
- ✅ 即時訊息顯示 (WebSocket)
- ✅ 樣式客製化管理

### 第二階段 - 平台整合 (開發中)
- ⏳ YouTube Live Chat API
- ⏳ Twitch Chat API  
- ⏳ 綠界金流整合
- ⏳ 斗內進度軸
- ⏳ 聊天室分析功能

## 🛠️ 技術架構

- **前端**: React 18 + TypeScript + Tailwind CSS
- **後端**: Node.js + Express + TypeScript
- **即時通訊**: Socket.IO
- **資料庫**: PostgreSQL (生產) / SQLite (開發)
- **認證**: Firebase Auth
- **部署**: Vercel (前端) + Railway (後端)

## 📖 文件

- [部署指南](docs/DEPLOYMENT.md)
- [API 文件](docs/API.md)
- [開發指南](docs/DEVELOPMENT.md)

## 🎨 OBS 整合

### 聊天室顯示
1. 在 OBS 中新增「瀏覽器來源」
2. URL: `https://yourdomain.com/display/chat/{userId}/{styleId}`
3. 寬度: 800px, 高度: 600px
4. 勾選「關機時重新整理瀏覽器」

### 樣式設定
在後台管理介面中可以：
- 建立多個聊天室顯示樣式
- 即時預覽效果
- 調整字體、顏色、動畫等參數

## 🔧 開發指南

### 環境變數設定
參考 `.env.example` 檔案設定以下環境變數：

```env
# Firebase 設定
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_domain

# 資料庫設定  
DATABASE_URL=postgresql://username:password@localhost:5432/dbname

# JWT 設定
JWT_SECRET=your_jwt_secret

# 其他設定
PORT=3001
NODE_ENV=development
```

### 程式碼風格
- 使用 TypeScript 嚴格模式
- 遵循 ESLint + Prettier 設定
- 組件使用 React Hooks
- API 使用 RESTful 設計

## 🚀 部署

### 自動部署
推送到 `main` 分支會自動觸發部署：
- Frontend 部署到 Vercel
- Backend 部署到 Railway

### 手動部署
參考 [部署指南](docs/DEPLOYMENT.md) 進行手動部署設定。

## 📝 開發進度

- [x] 專案架構建立
- [x] 基礎認證系統
- [x] 聊天室樣式管理
- [x] 前台顯示頁面
- [x] WebSocket 即時通訊
- [ ] YouTube API 整合
- [ ] Twitch API 整合
- [ ] 綠界金流整合

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

## 📞 聯絡

如有問題請開 Issue 或聯絡開發團隊。

---

⭐ 如果這個專案對您有幫助，請給我們一個 Star！