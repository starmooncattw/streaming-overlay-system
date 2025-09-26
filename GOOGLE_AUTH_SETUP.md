# 🔐 Google 認證系統設置指南

## 📋 概覽
本系統使用 Google OAuth 進行認證，所有用戶都是直播主身份。

## 🚨 必要設置步驟

### 1. Firebase 專案設置

#### 1.1 建立 Firebase 專案
1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「建立專案」
3. 輸入專案名稱：`streaming-overlay-system`
4. 選擇是否啟用 Google Analytics (建議啟用)
5. 完成專案建立

#### 1.2 啟用 Google 認證
1. 在 Firebase Console 中選擇您的專案
2. 前往「Authentication」→「Sign-in method」
3. 點擊「Google」提供者
4. 啟用 Google 登入
5. 設定支援電子郵件（您的專案聯絡電子郵件）
6. 儲存設定

#### 1.3 設定 Firestore 資料庫
1. 前往「Firestore Database」
2. 點擊「建立資料庫」
3. 選擇「以測試模式啟動」（稍後會設定安全規則）
4. 選擇資料庫位置（建議選擇離您最近的區域）

### 2. 獲取 Firebase 配置

1. 前往「專案設定」→「一般」
2. 在「您的應用程式」區段中，點擊「Web 應用程式」圖示
3. 註冊應用程式名稱：`streaming-overlay-frontend`
4. 複製 Firebase 配置物件

### 3. 環境變數設定

在 `frontend/.env` 檔案中設定以下變數：

```env
# Firebase 配置 (用於 Google OAuth 登入)
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 4. Firestore 安全規則

在 Firebase Console 的 Firestore 中設定以下安全規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 直播主資料 - 只有本人可以讀寫
    match /streamers/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 直播設定 - 只有本人可以讀寫
    match /streamers/{userId}/settings/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 公開的直播資訊 - 所有人可讀，只有本人可寫
    match /public_streams/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. 授權網域設定

1. 在 Firebase Console 中前往「Authentication」→「Settings」
2. 在「授權網域」區段中添加：
   - `localhost` (開發環境)
   - 您的生產網域 (如果有)

## 🎯 系統特色

### 單一角色設計
- 所有用戶都是直播主身份
- 無需角色選擇流程
- 簡化的註冊和登入體驗

### Google 登入優勢
- 安全可靠的認證
- 無需記憶額外密碼
- 快速登入體驗
- 自動獲取用戶基本資訊

### 直播主資料結構
```typescript
interface StreamerProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  streamSettings: {
    streamTitle?: string;
    streamDescription?: string;
    overlayEnabled: boolean;
    chatEnabled: boolean;
    donationEnabled: boolean;
  };
  socialLinks?: {
    youtube?: string;
    twitch?: string;
    twitter?: string;
    instagram?: string;
  };
}
```

## 🔧 開發環境測試

### 測試 Google 登入
1. 啟動開發服務器：`npm start`
2. 前往 `http://localhost:3001/login`
3. 點擊「使用 Google 登入」
4. 選擇 Google 帳號並授權
5. 成功後應重定向到 Dashboard

### 檢查 Firestore 資料
1. 登入後檢查 Firebase Console 的 Firestore
2. 應該看到 `streamers` 集合中有新的文檔
3. 文檔 ID 應該是用戶的 UID

## 🚨 注意事項

1. **測試環境**：在開發階段，Firestore 規則可以設為測試模式，但生產環境必須設定適當的安全規則
2. **API 配額**：Google 認證有每日配額限制，正常使用不會超過
3. **隱私政策**：如果公開發布，需要提供隱私政策連結
4. **域名驗證**：生產環境需要在 Firebase 中添加授權域名

## 📞 支援

如果遇到設置問題：
1. 檢查 Firebase Console 中的錯誤日誌
2. 確認環境變數是否正確設定
3. 檢查瀏覽器開發者工具的 Console 錯誤訊息
