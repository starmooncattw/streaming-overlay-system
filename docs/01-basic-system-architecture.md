# 01-Basic System Architecture - 基礎系統架構

> 🤖 **AI 使用指南**：此為 Streaming Overlay System 的基礎架構模組，所有其他模組都依賴於此基礎。AI 應確保用戶完成所有步驟後獲得可正常運作的 MVP 系統。

## 🔄 前置需求檢查

### 📋 **必要條件**
- [ ] **依賴文檔**: 00-專案總覽 (建議先閱讀)
- [ ] **必要工具**: Node.js 18+、Git、瀏覽器、程式碼編輯器
- [ ] **帳號需求**: Google 帳號、GitHub 帳號
- [ ] **技能需求**: 🟢 簡單 - 基礎 JavaScript 和命令列操作
- [ ] **預估時間**: ⏱️ 2-3 週 (每日 2-4 小時)

### 🎯 **完成後可獲得**
- ✅ 完整的使用者認證系統 (Google OAuth)
- ✅ 基礎顯示引擎與透明背景功能
- ✅ 樣式管理系統 (CRUD 操作)
- ✅ 手動測試訊息功能
- ✅ OBS 整合就緒的 MVP 系統

## 🎯 本階段目標

### 🏗️ **主要任務**
建立系統核心架構，實現最小可行產品（MVP），確保直播主能立即使用基礎功能。

### 📊 **完成標準**
- 用戶可以使用 Google 帳號登入系統
- 可以建立和管理聊天室顯示樣式
- OBS 可以載入透明背景的顯示頁面
- 手動測試訊息功能正常運作
- 系統穩定運行，無重大錯誤

## 🔧 詳細執行步驟

### 🚨 第一步：開發環境設定
**位置**: 本地開發環境
**目標**: 建立完整的開發環境和工具鏈
**🎯 用戶情境**: 🟢 BEGINNER | 🟡 INTERMEDIATE | 🔴 ADVANCED

#### 💻 1.1 安裝 Node.js 和 npm
```bash
# 📋 CHECKLIST - 安裝 Node.js 18+
# 前往 https://nodejs.org/ 下載 LTS 版本
# 或使用 nvm (推薦)

# Windows (使用 Chocolatey)
choco install nodejs

# macOS (使用 Homebrew)
brew install node

# 驗證安裝
node --version
npm --version
```

**🔍 驗證方法**：
```bash
# 💻 COMMAND - 檢查版本
node --version
npm --version
# 預期結果：Node.js v18.x.x 或更高版本，npm v9.x.x 或更高版本
```

**⚠️ 常見問題**：
- **問題**: Windows 上 npm 權限錯誤
- **🟢 BEGINNER 解決方案**: 以系統管理員身分執行命令提示字元
- **🟡 INTERMEDIATE 解決方案**: 設定 npm 全域安裝路徑 `npm config set prefix ~/.npm-global`

#### 💻 1.2 安裝 Git 版本控制
```bash
# 📋 CHECKLIST - 安裝 Git
# 前往 https://git-scm.com/ 下載安裝

# 設定 Git 使用者資訊
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**🔍 驗證方法**：
```bash
# 💻 COMMAND - 檢查 Git 設定
git --version
git config --list
# 預期結果：顯示 Git 版本和使用者設定
```

#### 💻 1.3 建立專案目錄結構
```bash
# 📋 CHECKLIST - 建立專案根目錄
mkdir streaming-overlay-system
cd streaming-overlay-system

# 建立標準目錄結構
mkdir frontend backend
mkdir docs tests deployment

# 初始化 Git 儲存庫
git init
```

**🔍 驗證方法**：
```bash
# 💻 COMMAND - 檢查目錄結構
ls -la
# 預期結果：看到 frontend/, backend/, docs/, tests/, deployment/ 目錄
```

### 🚨 第二步：Firebase 專案設定
**位置**: Firebase Console + 本地環境
**目標**: 建立 Firebase 專案並設定認證服務
**🎯 用戶情境**: 🟢 BEGINNER | 🟡 INTERMEDIATE

#### 💻 2.1 建立 Firebase 專案
```bash
# 📋 CHECKLIST - 在 Firebase Console 建立專案
# 1. 前往 https://console.firebase.google.com/
# 2. 點擊「建立專案」
# 3. 輸入專案名稱：streaming-overlay-system
# 4. 啟用 Google Analytics (建議)
# 5. 選擇或建立 Analytics 帳戶
# 6. 等待專案建立完成
```

**🔍 驗證方法**：
- 確認專案出現在 Firebase Console 中
- 專案 ID 格式正確 (通常是 streaming-overlay-system-xxxxx)

#### 💻 2.2 啟用 Firebase 服務
```bash
# 📋 CHECKLIST - 啟用必要的 Firebase 服務
# 在 Firebase Console 中：

# 1. 啟用 Authentication
#    左側選單 → Authentication → 開始使用
#    Sign-in method → Google → 啟用

# 2. 啟用 Firestore Database
#    左側選單 → Firestore Database → 建立資料庫
#    選擇「測試模式」→ 選擇地區 (asia-east1)

# 3. 啟用 Hosting
#    左側選單 → Hosting → 開始使用
```

**🔍 驗證方法**：
- Authentication 頁面顯示 Google 提供者已啟用
- Firestore 顯示「測試模式」資料庫
- Hosting 顯示準備就緒狀態

#### 💻 2.3 安裝 Firebase CLI
```bash
# 📋 CHECKLIST - 安裝 Firebase 命令列工具
npm install -g firebase-tools

# 登入 Firebase
firebase login

# 初始化 Firebase 專案
firebase init
```

**🔍 驗證方法**：
```bash
# 💻 COMMAND - 檢查 Firebase CLI
firebase --version
firebase projects:list
# 預期結果：顯示 Firebase CLI 版本和專案列表
```

**⚠️ 常見問題**：
- **問題**: `firebase login` 無法開啟瀏覽器
- **🟢 BEGINNER 解決方案**: 使用 `firebase login --no-localhost`
- **🟡 INTERMEDIATE 解決方案**: 檢查防火牆設定或使用 `firebase login --reauth`

### 🚨 第三步：前端基礎架構建立
**位置**: frontend/ 目錄
**目標**: 建立 React + TypeScript 前端應用
**🎯 用戶情境**: 🟢 BEGINNER | 🟡 INTERMEDIATE | 🔴 ADVANCED

#### 💻 3.1 建立 React 應用
```bash
# 📋 CHECKLIST - 建立 React + TypeScript 專案
cd frontend

# 使用 Vite 建立 React 專案 (推薦，速度快)
npm create vite@latest . -- --template react-ts

# 或使用 Create React App (較穩定)
# npx create-react-app . --template typescript

# 安裝相依套件
npm install
```

**🔍 驗證方法**：
```bash
# 💻 COMMAND - 啟動開發伺服器
npm run dev
# 預期結果：瀏覽器開啟 http://localhost:5173 顯示 React 歡迎頁面
```

#### 💻 3.2 安裝必要套件
```bash
# 📋 CHECKLIST - 安裝專案相依套件
# Firebase SDK
npm install firebase

# 路由管理
npm install react-router-dom
npm install @types/react-router-dom --save-dev

# UI 框架
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 狀態管理和工具
npm install axios uuid
npm install @types/uuid --save-dev
```

**🔍 驗證方法**：
```bash
# 💻 COMMAND - 檢查套件安裝
npm list --depth=0
# 預期結果：顯示所有已安裝的套件版本
```

#### 💻 3.3 設定 Tailwind CSS
```bash
# 📋 CHECKLIST - 配置 Tailwind CSS
# 編輯 tailwind.config.js
```

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```css
/* 編輯 src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* OBS 透明背景支援 */
.obs-display {
  background: transparent !important;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

/* 聊天訊息樣式 */
.chat-message {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  padding: 8px 12px;
  margin: 4px 0;
}
```

**🔍 驗證方法**：
```bash
# 💻 COMMAND - 測試 Tailwind 樣式
# 在 src/App.tsx 中添加 Tailwind 類別測試
npm run dev
# 預期結果：Tailwind 樣式正常套用
```

### 🚨 第四步：Firebase 整合設定
**位置**: frontend/src/ 目錄
**目標**: 整合 Firebase 認證和資料庫服務
**🎯 用戶情境**: 🟡 INTERMEDIATE | 🔴 ADVANCED

#### 💻 4.1 建立 Firebase 配置
```typescript
// 📋 CHECKLIST - 建立 src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化服務
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
```

**🔍 驗證方法**：
```bash
# 💻 COMMAND - 檢查 Firebase 配置
# 在瀏覽器開發者工具 Console 中應該沒有 Firebase 錯誤
```

**⚠️ 常見問題**：
- **問題**: Firebase 配置錯誤
- **🟢 BEGINNER 解決方案**: 在 Firebase Console → 專案設定 → 一般 → 應用程式中找到配置
- **🟡 INTERMEDIATE 解決方案**: 使用環境變數管理敏感配置

#### 💻 4.2 建立認證服務
```typescript
// 📋 CHECKLIST - 建立 src/services/authService.ts
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

const googleProvider = new GoogleAuthProvider();

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export const authService = {
  // Google 登入
  async signInWithGoogle(): Promise<UserProfile> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // 生成隨機 userId (隱私保護)
      const userId = uuidv4();
      
      const userProfile: UserProfile = {
        id: userId,
        email: user.email!,
        displayName: user.displayName!,
        avatarUrl: user.photoURL || undefined,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };
      
      // 儲存用戶資料
      await setDoc(doc(db, 'users', userId), userProfile);
      
      return userProfile;
    } catch (error) {
      console.error('Google 登入失敗:', error);
      throw error;
    }
  },

  // 登出
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('登出失敗:', error);
      throw error;
    }
  },

  // 監聽認證狀態
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
};
```

**🔍 驗證方法**：
```typescript
// 💻 COMMAND - 測試認證服務
// 在 React 組件中測試登入功能
console.log('Auth service loaded successfully');
```

### 🚨 第五步：使用者介面建立
**位置**: frontend/src/ 目錄
**目標**: 建立登入頁面和主控台介面
**🎯 用戶情境**: 🟢 BEGINNER | 🟡 INTERMEDIATE

#### 💻 5.1 建立登入頁面
```tsx
// 📋 CHECKLIST - 建立 src/pages/LoginPage.tsx
import React from 'react';
import { authService } from '../services/authService';

export const LoginPage: React.FC = () => {
  const handleGoogleLogin = async () => {
    try {
      const userProfile = await authService.signInWithGoogle();
      console.log('登入成功:', userProfile);
      // 導向主控台
      window.location.href = '/dashboard';
    } catch (error) {
      alert('登入失敗，請重試');
      console.error('登入錯誤:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎮 Streaming Overlay
          </h1>
          <p className="text-gray-600">
            直播覆蓋系統 - 提升您的直播體驗
          </p>
        </div>
        
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
        >
          <span>🔐</span>
          <span>使用 Google 帳號登入</span>
        </button>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>登入即表示您同意我們的服務條款</p>
        </div>
      </div>
    </div>
  );
};
```

**🔍 驗證方法**：
```bash
# 💻 COMMAND - 測試登入頁面
npm run dev
# 預期結果：顯示美觀的登入頁面，點擊按鈕可觸發 Google 登入
```

#### 💻 5.2 建立主控台頁面
```tsx
// 📋 CHECKLIST - 建立 src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { User } from 'firebase/auth';

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
      
      if (!user) {
        // 未登入，導向登入頁
        window.location.href = '/';
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 導航列 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                🎮 Streaming Overlay 控制台
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                歡迎，{user?.displayName}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 樣式管理卡片 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                🎨 樣式管理
              </h3>
              <p className="text-gray-600 mb-4">
                建立和管理聊天室顯示樣式
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                管理樣式
              </button>
            </div>

            {/* 測試訊息卡片 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                💬 測試訊息
              </h3>
              <p className="text-gray-600 mb-4">
                發送測試訊息到顯示頁面
              </p>
              <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                發送測試
              </button>
            </div>

            {/* OBS 整合卡片 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                📺 OBS 整合
              </h3>
              <p className="text-gray-600 mb-4">
                獲取 OBS Browser Source 網址
              </p>
              <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                取得網址
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};
```

**🔍 驗證方法**：
```bash
# 💻 COMMAND - 測試主控台
# 登入後應該看到主控台頁面，包含三個功能卡片
```

### 🚨 第六步：樣式管理系統
**位置**: frontend/src/ 目錄
**目標**: 建立聊天室樣式的 CRUD 功能
**🎯 用戶情境**: 🟡 INTERMEDIATE | 🔴 ADVANCED

#### 💻 6.1 建立樣式資料模型
```typescript
// 📋 CHECKLIST - 建立 src/types/style.ts
export interface ChatStyle {
  id: string;
  userId: string;
  name: string;
  displayMode: 'horizontal' | 'dialog' | 'danmaku' | 'notebook';
  
  // 字體設定
  font: {
    family: string;
    size: number;
    weight: 'normal' | 'bold' | 'lighter';
    color: string;
  };
  
  // 背景設定
  background: {
    color: string;
    opacity: number;
    blur: number;
  };
  
  // 動畫效果
  animation?: {
    entrance: 'fade' | 'slide' | 'bounce' | 'none';
    duration: number;
    delay: number;
  };
  
  // 佈局設定
  layout: {
    padding: number;
    margin: number;
    borderRadius: number;
    maxWidth?: number;
    alignment: 'left' | 'center' | 'right';
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export const defaultChatStyle: Omit<ChatStyle, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  name: '預設樣式',
  displayMode: 'horizontal',
  font: {
    family: 'Arial, sans-serif',
    size: 16,
    weight: 'normal',
    color: '#FFFFFF'
  },
  background: {
    color: '#000000',
    opacity: 0.7,
    blur: 0
  },
  animation: {
    entrance: 'fade',
    duration: 300,
    delay: 0
  },
  layout: {
    padding: 12,
    margin: 8,
    borderRadius: 4,
    maxWidth: 400,
    alignment: 'left'
  }
};
```

#### 💻 6.2 建立樣式服務
```typescript
// 📋 CHECKLIST - 建立 src/services/styleService.ts
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ChatStyle, defaultChatStyle } from '../types/style';
import { v4 as uuidv4 } from 'uuid';

export const styleService = {
  // 建立新樣式
  async createStyle(userId: string, styleData: Partial<ChatStyle>): Promise<ChatStyle> {
    try {
      const newStyle: ChatStyle = {
        id: uuidv4(),
        userId,
        ...defaultChatStyle,
        ...styleData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = doc(db, 'chatStyles', newStyle.id);
      await setDoc(docRef, newStyle);

      return newStyle;
    } catch (error) {
      console.error('建立樣式失敗:', error);
      throw error;
    }
  },

  // 獲取使用者所有樣式
  async getStylesByUser(userId: string): Promise<ChatStyle[]> {
    try {
      const q = query(
        collection(db, 'chatStyles'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as ChatStyle);
    } catch (error) {
      console.error('獲取樣式失敗:', error);
      throw error;
    }
  },

  // 獲取特定樣式
  async getStyleById(styleId: string): Promise<ChatStyle | null> {
    try {
      const docRef = doc(db, 'chatStyles', styleId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as ChatStyle;
      } else {
        return null;
      }
    } catch (error) {
      console.error('獲取樣式失敗:', error);
      throw error;
    }
  },

  // 更新樣式
  async updateStyle(styleId: string, updates: Partial<ChatStyle>): Promise<void> {
    try {
      const docRef = doc(db, 'chatStyles', styleId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('更新樣式失敗:', error);
      throw error;
    }
  },

  // 刪除樣式
  async deleteStyle(styleId: string): Promise<void> {
    try {
      const docRef = doc(db, 'chatStyles', styleId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('刪除樣式失敗:', error);
      throw error;
    }
  },

  // 複製樣式
  async duplicateStyle(styleId: string, newName: string): Promise<ChatStyle> {
    try {
      const originalStyle = await this.getStyleById(styleId);
      if (!originalStyle) {
        throw new Error('找不到要複製的樣式');
      }

      const duplicatedStyle = {
        ...originalStyle,
        name: newName,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = doc(db, 'chatStyles', duplicatedStyle.id);
      await setDoc(docRef, duplicatedStyle);

      return duplicatedStyle;
    } catch (error) {
      console.error('複製樣式失敗:', error);
      throw error;
    }
  }
};
```

**🔍 驗證方法**：
```typescript
// 💻 COMMAND - 測試樣式服務
// 在瀏覽器 Console 中測試
console.log('Style service loaded successfully');
```

### 🚨 第七步：OBS 顯示頁面
**位置**: frontend/src/ 目錄
**目標**: 建立透明背景的聊天室顯示頁面
**🎯 用戶情境**: 🟡 INTERMEDIATE | 🔴 ADVANCED

#### 💻 7.1 建立顯示頁面組件
```tsx
// 📋 CHECKLIST - 建立 src/pages/DisplayPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { styleService } from '../services/styleService';
import { ChatStyle } from '../types/style';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  platform?: 'youtube' | 'twitch' | 'test';
}

export const DisplayPage: React.FC = () => {
  const { type, streamerId, styleId } = useParams<{
    type: string;
    streamerId: string;
    styleId: string;
  }>();
  
  const [style, setStyle] = useState<ChatStyle | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStyle();
    // 這裡後續會整合 WebSocket 接收即時訊息
    addTestMessage(); // 暫時添加測試訊息
  }, [styleId]);

  const loadStyle = async () => {
    if (!styleId) return;
    
    try {
      const styleData = await styleService.getStyleById(styleId);
      setStyle(styleData);
    } catch (error) {
      console.error('載入樣式失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTestMessage = () => {
    const testMessage: ChatMessage = {
      id: Date.now().toString(),
      username: '測試用戶',
      message: '這是一條測試訊息！',
      timestamp: new Date(),
      platform: 'test'
    };
    setMessages([testMessage]);
  };

  const generateMessageStyle = (style: ChatStyle) => {
    return {
      fontFamily: style.font.family,
      fontSize: `${style.font.size}px`,
      fontWeight: style.font.weight,
      color: style.font.color,
      backgroundColor: `${style.background.color}${Math.round(style.background.opacity * 255).toString(16).padStart(2, '0')}`,
      padding: `${style.layout.padding}px`,
      margin: `${style.layout.margin}px`,
      borderRadius: `${style.layout.borderRadius}px`,
      maxWidth: style.layout.maxWidth ? `${style.layout.maxWidth}px` : 'none',
      textAlign: style.layout.alignment as any,
      backdropFilter: style.background.blur > 0 ? `blur(${style.background.blur}px)` : 'none'
    };
  };

  if (loading) {
    return (
      <div className="obs-display min-h-screen flex items-center justify-center">
        <div className="text-white">載入中...</div>
      </div>
    );
  }

  if (!style) {
    return (
      <div className="obs-display min-h-screen flex items-center justify-center">
        <div className="text-white">找不到指定的樣式</div>
      </div>
    );
  }

  return (
    <div className="obs-display min-h-screen p-4">
      <div className={`chat-container ${style.displayMode}`}>
        {messages.map((message) => (
          <div
            key={message.id}
            className="chat-message"
            style={generateMessageStyle(style)}
          >
            <span className="username font-semibold">
              {message.username}:
            </span>
            <span className="message ml-2">
              {message.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

**🔍 驗證方法**：
```bash
# 💻 COMMAND - 測試 OBS 顯示頁面
# 訪問 /view/chat/test-user/test-style 應該顯示透明背景的測試訊息
```

### 🚨 第八步：路由設定和整合
**位置**: frontend/src/ 目錄
**目標**: 設定完整的路由系統
**🎯 用戶情境**: 🟢 BEGINNER | 🟡 INTERMEDIATE

#### 💻 8.1 設定 React Router
```tsx
// 📋 CHECKLIST - 更新 src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { DisplayPage } from './pages/DisplayPage';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/view/:type/:streamerId/:styleId" element={<DisplayPage />} />
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">404 - 頁面不存在</h1>
                <a href="/" className="text-blue-600 hover:underline">返回首頁</a>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```

**🔍 驗證方法**：
```bash
# 💻 COMMAND - 測試路由系統
npm run dev
# 預期結果：可以正常導航到不同頁面，URL 變化正確
```

## ✅ 完成驗證

### 🧪 **功能測試**
```markdown
測試清單：
- [ ] 用戶可以使用 Google 帳號登入
- [ ] 登入後正確導向主控台頁面
- [ ] 主控台顯示用戶資訊和功能卡片
- [ ] 可以訪問 OBS 顯示頁面 (/view/chat/test/test)
- [ ] 顯示頁面有透明背景效果
- [ ] 測試訊息正確顯示並套用樣式
```

### 🔍 **品質檢查**
- [ ] 所有 TypeScript 類型定義正確
- [ ] Firebase 連接正常，無 Console 錯誤
- [ ] Tailwind CSS 樣式正常套用
- [ ] 響應式設計在不同螢幕尺寸下正常
- [ ] OBS 透明背景效果正確

### 📊 **效能驗證**
- [ ] 頁面載入時間 < 3 秒
- [ ] Firebase 認證回應時間 < 2 秒
- [ ] 樣式切換無明顯延遲
- [ ] 記憶體使用合理 (< 100MB)

## 🔄 下一步

### 🎯 **建議路徑**
**下一個階段**: 02-即時通訊系統 - 建立 WebSocket 通訊機制

### 💡 **可選擴展**
- **如果需要更多樣式選項**: 可以先擴展樣式管理功能
- **如果需要測試更多功能**: 可以添加更多測試訊息類型
- **如果需要進階 UI**: 可以優化使用者介面設計

### 🔧 **進階配置 (可選)**
- 設定環境變數管理 Firebase 配置
- 添加 PWA 支援實現離線功能
- 整合 Sentry 進行錯誤追蹤
- 設定 ESLint 和 Prettier 代碼規範

## 🤖 **AI 執行注意事項**

### 🎯 **用戶情境適應**
- **🟢 BEGINNER**: 詳細解釋每個步驟的目的，提供豐富的故障排除指導，確保每個驗證步驟都完成
- **🟡 INTERMEDIATE**: 重點說明架構設計考量，提供最佳實務建議，可以適度簡化基礎步驟說明
- **🔴 ADVANCED**: 深入討論技術選型原因，提供效能最佳化建議，可以並行執行多個步驟

### ⚠️ **常見 AI 執行錯誤**
1. **跳過驗證步驟** - 每個步驟都必須確認完成才能進行下一步
2. **忽略錯誤處理** - 必須提供完整的錯誤處理和故障排除指導
3. **配置不完整** - Firebase 配置、TypeScript 設定等必須完整正確
4. **忽視用戶技能差異** - 根據用戶回饋調整說明詳細程度

### 🔄 **分段策略**
- **開發環境設定** → 確保工具鏈完整可用
- **Firebase 整合** → 確保雲端服務正常連接
- **前端架構** → 確保 React 應用正常運行
- **功能實現** → 確保核心功能完整可用

---

**🎉 恭喜！** 您已完成 Streaming Overlay System 的基礎架構建立。現在您擁有一個可運行的 MVP 系統，包含完整的使用者認證、樣式管理和 OBS 整合功能。

**📊 當前系統狀態**: ✅ MVP 就緒，可以進行下一階段開發

**🚀 下一步建議**: 開始建立 02-即時通訊系統，為後續的聊天室整合做準備！
