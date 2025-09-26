# 🔥 Firebase 認證系統設置指南

## 📋 概覽
本指南將協助您設置 Firebase 認證系統，包含依賴安裝、Firebase 專案配置和環境變數設定。

## 🚨 必要依賴安裝

### 前端依賴
```bash
cd frontend

# Firebase SDK
npm install firebase

# React 相關依賴
npm install react react-dom react-router-dom
npm install react-redux @reduxjs/toolkit
npm install react-hook-form
npm install react-hot-toast
npm install styled-components

# TypeScript 類型定義
npm install --save-dev @types/react @types/react-dom
npm install --save-dev @types/node
npm install --save-dev @types/styled-components
```

### 後端依賴 (如果需要 Firebase Admin SDK)
```bash
cd backend

# Firebase Admin SDK
npm install firebase-admin

# 其他相關依賴
npm install cors helmet morgan
npm install --save-dev @types/cors @types/helmet @types/morgan
```

## 🔧 Firebase 專案設置

### 1. 建立 Firebase 專案
1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「建立專案」
3. 輸入專案名稱：`streaming-overlay-system`
4. 選擇是否啟用 Google Analytics (建議啟用)
5. 完成專案建立

### 2. 啟用認證服務
1. 在 Firebase Console 中選擇您的專案
2. 點擊左側選單的「Authentication」
3. 點擊「開始使用」
4. 在「Sign-in method」標籤中啟用以下方式：
   - ✅ 電子郵件/密碼
   - ✅ Google (可選)
   - ✅ GitHub (可選)

### 3. 設置 Firestore 資料庫
1. 點擊左側選單的「Firestore Database」
2. 點擊「建立資料庫」
3. 選擇「以測試模式開始」(稍後會設置安全規則)
4. 選擇資料庫位置 (建議選擇 asia-east1)

### 4. 設置 Storage
1. 點擊左側選單的「Storage」
2. 點擊「開始使用」
3. 選擇「以測試模式開始」
4. 選擇儲存位置 (建議選擇 asia-east1)

## 🔑 獲取 Firebase 配置

### Web 應用配置
1. 在 Firebase Console 中點擊專案設定 (齒輪圖示)
2. 滾動到「您的應用程式」區域
3. 點擊「</> Web」圖示
4. 輸入應用程式暱稱：`streaming-overlay-frontend`
5. 勾選「同時為此應用程式設定 Firebase Hosting」(可選)
6. 複製配置物件

### 配置範例
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "streaming-overlay-system.firebaseapp.com",
  projectId: "streaming-overlay-system",
  storageBucket: "streaming-overlay-system.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop",
  measurementId: "G-XXXXXXXXXX"
};
```

## 📝 環境變數設定

### 前端環境變數 (.env)
```bash
# 複製 .env.example 到 .env
cp .env.example .env

# 編輯 .env 檔案，填入您的 Firebase 配置
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 後端環境變數 (如果使用 Firebase Admin)
```bash
# 後端 .env 檔案
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

## 🔒 安全規則設定

### Firestore 安全規則
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用戶只能讀寫自己的資料
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 公開讀取的資料 (如直播資訊)
    match /streams/{streamId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (resource.data.streamerId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // 捐款資料
    match /donations/{donationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

### Storage 安全規則
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 用戶頭像
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 疊加層資源
    match /overlays/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧪 開發環境模擬器 (可選)

### 安裝 Firebase CLI
```bash
npm install -g firebase-tools
```

### 登入 Firebase
```bash
firebase login
```

### 初始化專案
```bash
firebase init
```

### 啟動模擬器
```bash
firebase emulators:start
```

模擬器端口：
- Authentication: http://localhost:9099
- Firestore: http://localhost:8080
- Storage: http://localhost:9199

## ✅ 驗證設置

### 1. 檢查依賴安裝
```bash
cd frontend
npm list firebase react react-redux @reduxjs/toolkit
```

### 2. 檢查環境變數
```bash
# 確認 .env 檔案存在且包含所有必要變數
cat .env | grep REACT_APP_FIREBASE
```

### 3. 測試 Firebase 連接
```bash
# 啟動前端開發服務器
npm start

# 檢查瀏覽器控制台是否有 Firebase 連接成功訊息
```

## 🚨 常見問題

### 問題 1: 找不到 Firebase 模組
```bash
# 解決方案：安裝 Firebase SDK
npm install firebase
```

### 問題 2: TypeScript 類型錯誤
```bash
# 解決方案：安裝類型定義
npm install --save-dev @types/node @types/react @types/react-dom
```

### 問題 3: 環境變數未載入
```bash
# 確認 .env 檔案在正確位置 (frontend/.env)
# 確認變數名稱以 REACT_APP_ 開頭
# 重新啟動開發服務器
```

### 問題 4: Firebase 配置錯誤
- 檢查 Firebase Console 中的專案設定
- 確認 API 金鑰和專案 ID 正確
- 檢查網域是否已授權

## 📚 相關文檔

- [Firebase 官方文檔](https://firebase.google.com/docs)
- [Firebase Auth 文檔](https://firebase.google.com/docs/auth)
- [Firestore 文檔](https://firebase.google.com/docs/firestore)
- [Firebase Storage 文檔](https://firebase.google.com/docs/storage)

---

**建立時間**: 2025-09-26 10:30:00  
**最後更新**: 2025-09-26 10:30:00  
**維護者**: AI Assistant
