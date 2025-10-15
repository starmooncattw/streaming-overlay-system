# 綠界斗內 SuperChat 系統 - 方案 B 規格文件

## 專案概述
使用 Vue.js + Firebase + Firestore 打造類似 YouTube SuperChat 的斗內顯示系統，適用於 OBS，並支援後續資料整合應用。

## 技術架構

### 前端技術棧
- Vue 3 (CDN 引入)
- 原生 CSS (模仿 YouTube SuperChat)
- Firebase SDK (CDN 引入)
- 單一 HTML 檔案設計

### 後端技術棧
- Firebase Cloud Functions (Node.js)
- Firestore Database
- Cloud Scheduler (定時任務)
- HTTPS API 端點

## 系統架構圖

```
綠界 Donation API
    ↓ (每 5 秒抓取)
Cloud Function (fetchDonations)
    ↓ (寫入)
Firestore Database
    ↓ (即時同步 onSnapshot)
Vue.js 前端 (單一 HTML)
    ↓ (顯示)
OBS 瀏覽器來源
```

## Firestore 資料結構

### Collection: donations
```javascript
{
  id: "auto-generated-doc-id",
  name: "斗內者名稱",
  amount: 500,
  message: "加油繼續努力!",
  timestamp: Timestamp,
  alertBoxId: "YOUR_ECPAY_ALERTBOX_ID",
  isDisplayed: false,
  createdAt: Timestamp
}
```

### Collection: stats
```javascript
{
  alertBoxId: "YOUR_ID",
  totalAmount: 50000,
  totalCount: 123,
  topDonor: {
    name: "最高斗內者",
    amount: 5000
  },
  lastUpdate: Timestamp
}
```

### Collection: config
```javascript
{
  alertBoxId: "YOUR_ID",
  displayDuration: 10,  // SuperChat 顯示秒數
  maxDisplay: 5,        // 同時顯示數量
  enableTTS: true,
  defaultAvatar: "url"
}
```

## Firebase Functions 規劃

### Function 1: fetchECPayDonations
**觸發方式**: Cloud Scheduler (每 5 秒)
**功能**:
- 呼叫綠界內部 API
- 比對 Firestore 現有資料
- 僅寫入新的斗內記錄
- 更新統計資料

**程式邏輯**:
```
1. 取得 alertBoxId 設定
2. 呼叫綠界 API (需逆向工程取得端點)
3. 取得最新斗內清單
4. 查詢 Firestore 最後一筆 timestamp
5. 篩選新資料
6. 批次寫入 Firestore
```

### Function 2: onDonationCreated
**觸發方式**: Firestore Trigger (onCreate)
**路徑**: donations/{donationId}
**功能**:
- 更新即時統計
- 發送 Discord/Line 通知 (可選)
- 觸發其他整合應用
- 檢查里程碑達成

**程式邏輯**:
```
1. 讀取新增的 donation 資料
2. 更新 stats collection
3. 檢查是否為最高斗內
4. 若金額 >= 設定值，發送通知
5. 記錄到 logs collection
```

### Function 3: getHistoryDonations (HTTP)
**觸發方式**: HTTPS 請求
**路徑**: /api/donations?alertBoxId={id}&limit={n}
**功能**: 查詢歷史斗內記錄

## 前端功能規格

### HTML 結構
```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <!-- Firebase SDK (CDN) -->
  <!-- Vue 3 (CDN) -->
  <!-- 自訂 CSS -->
</head>
<body>
  <div id="app">
    <!-- SuperChat 容器 -->
  </div>
</body>
</html>
```

### Vue 組件設計

#### SuperChat 組件
**顯示元素**:
- 作者頭像 (支援預設圖片)
- 作者名稱
- 斗內金額 (不同金額不同顏色)
- 留言內容
- 時間戳記

**動畫效果**:
- 進場動畫 (slide in from bottom)
- 高亮閃爍 (新訊息)
- 離場動畫 (fade out)
- 自動消失 (可設定秒數)

**樣式層級** (模仿 YouTube):
```
NT$ 100-499:   淺藍色背景
NT$ 500-999:   藍綠色背景
NT$ 1000-4999: 黃色背景
NT$ 5000+:     紅色背景 + 特效
```

### Firestore 監聽邏輯
```javascript
// 監聽新斗內
db.collection('donations')
  .where('alertBoxId', '==', YOUR_ID)
  .orderBy('timestamp', 'desc')
  .limit(20)
  .onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        // 新增 SuperChat 到畫面
      }
    });
  });
```

### LocalStorage 備份機制
- 定期備份 Firestore 資料到 LocalStorage
- 離線時顯示快取資料
- 網路恢復後自動同步

## 綠界 API 逆向工程

### AlertBox 分析
**URL**: https://payment.ecpay.com.tw/Broadcaster/AlertBox/{ID}

**需要找到的 API 端點**:
- WebSocket 或 SignalR 連線 URL
- 或 HTTP 輪詢端點
- 資料格式範例

**可能的資料來源**:
1. SignalR Hub (目前已知)
2. 內部 REST API (需要 token)
3. WebSocket 串流

### 認證機制
- 可能需要 JWT token
- Token 取得方式需要分析
- 或使用 SignalR 方式 (你提供的檔案已有範例)

## URL 路由設計

### 主要顯示頁面
`/superchat?id={ALERTBOX_ID}`

### 設定頁面
`/config?id={ALERTBOX_ID}`

### 統計頁面
`/stats?id={ALERTBOX_ID}`

## 部署流程

### Firebase 初始化
```bash
npm install -g firebase-tools
firebase login
firebase init
# 選擇: Functions, Firestore, Hosting
```

### Functions 部署
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### Hosting 部署
```bash
firebase deploy --only hosting
```

### Firestore 規則設定
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /donations/{donation} {
      allow read: if true;  // 公開讀取
      allow write: if false; // 只有 Functions 能寫入
    }
    match /stats/{stat} {
      allow read: if true;
    }
  }
}
```

## 成本估算

### 免費額度
- Cloud Functions: 200萬次/月
- Firestore 讀取: 5萬次/天
- Firestore 寫入: 2萬次/天
- Hosting: 10 GB/月

### 預估使用量 (中小型實況主)
- 每月直播 30 小時
- 每場約 50 筆斗內
- Functions 調用: ~21,600 次/月
- Firestore 寫入: ~1,500 次/月
- Firestore 讀取: ~50,000 次/月

**預估費用**: $0 (完全在免費額度內)

## 其他應用整合範例

### Discord Webhook
在 onDonationCreated Function 中:
```javascript
if (amount >= 1000) {
  await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      content: `💰 ${name} 斗內了 NT$ ${amount}!`
    })
  });
}
```

### Google Sheets 同步
使用 Google Sheets API 寫入斗內紀錄

### OBS WebSocket 控制
前端透過 obs-websocket-js 切換場景

### 遊戲整合
透過 HTTP API 傳送事件到遊戲伺服器

## 開發檢查清單

### 階段一: 基礎建設
- [ ] 建立 Firebase 專案
- [ ] 設定 Firestore 資料庫
- [ ] 建立 Collections 結構
- [ ] 設定安全規則

### 階段二: Cloud Functions
- [ ] fetchECPayDonations 函數
- [ ] onDonationCreated 觸發器
- [ ] 設定 Cloud Scheduler
- [ ] 測試 API 呼叫

### 階段三: 前端開發
- [ ] 建立單一 HTML 檔案
- [ ] 實作 Vue 組件
- [ ] Firestore 即時監聽
- [ ] SuperChat 樣式和動畫

### 階段四: 測試與優化
- [ ] OBS 瀏覽器測試
- [ ] 效能優化
- [ ] 錯誤處理
- [ ] 離線支援

### 階段五: 進階功能
- [ ] TTS 語音
- [ ] 自訂樣式設定
- [ ] 統計儀表板
- [ ] 第三方整合

## 注意事項

### 安全性
- 不要在前端暴露 Firebase Admin SDK
- 使用 Firestore 安全規則限制寫入
- API Key 可以公開 (有域名限制)
- 敏感操作都在 Cloud Functions 執行

### 效能優化
- 限制 Firestore 查詢筆數
- 使用 where + orderBy + limit
- 避免頻繁寫入統計資料 (可批次更新)
- 前端使用 CSS 動畫而非 JS 動畫

### 相容性
- 確保 OBS 瀏覽器支援 (Chrome 核心)
- 測試透明背景
- 測試不同解析度
- 確認音效播放正常

## 參考資源

### 官方文件
- Firebase 文件: https://firebase.google.com/docs
- Vue 3 文件: https://vuejs.org
- Firestore 查詢: https://firebase.google.com/docs/firestore/query-data/queries

### 靈感來源
- linnil1 的 Medium 文章 (CloudFlare Worker 版本): https://linnil1.medium.com/%E6%8A%8A%E7%B6%A0%E7%95%8C-donation-%E7%95%B6-superchat-%E7%94%A8-c414db2956e4
- YouTube SuperChat 樣式
- chatv2.septapus.com (樣式調整工具)

## 結語

此規格文件提供完整的技術架構和實作方向，可直接交給 AI 協助開發。重點是保持 serverless 精神，同時獲得資料庫帶來的彈性，讓斗內資料可以做更多應用。
