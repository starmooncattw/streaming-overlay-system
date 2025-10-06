import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase 配置
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// 檢查是否有必要的配置
const isFirebaseConfigured = firebaseConfig.apiKey && 
                             firebaseConfig.authDomain && 
                             firebaseConfig.projectId;

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let analytics: any = null;

if (isFirebaseConfigured) {
  try {
    // 初始化 Firebase
    app = initializeApp(firebaseConfig);
    
    // 初始化 Firebase 服務
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // 只在瀏覽器環境中初始化 Analytics
    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }
    
    console.log('✅ Firebase 初始化成功');
  } catch (error) {
    console.error('❌ Firebase 初始化失敗:', error);
  }
} else {
  console.warn('⚠️ Firebase 配置不完整，跳過初始化');
}

// 導出 Firebase 服務
export { app, auth, db, storage, analytics };

// 導出配置狀態
export const isFirebaseEnabled = isFirebaseConfigured && app !== null;

// Firebase 工具函數
export const firebaseUtils = {
  /**
   * 檢查 Firebase 是否可用
   */
  isAvailable: () => isFirebaseEnabled,
  
  /**
   * 獲取當前用戶
   */
  getCurrentUser: () => {
    if (!auth) return null;
    return auth.currentUser;
  },
  
  /**
   * 檢查用戶是否已登入
   */
  isUserSignedIn: () => {
    if (!auth) return false;
    return !!auth.currentUser;
  },
  
  /**
   * 格式化 Firebase 錯誤訊息
   */
  formatFirebaseError: (error: any): string => {
    const errorMessages: Record<string, string> = {
      'auth/user-not-found': '找不到此用戶',
      'auth/wrong-password': '密碼錯誤',
      'auth/email-already-in-use': '此電子郵件已被使用',
      'auth/weak-password': '密碼強度不足',
      'auth/invalid-email': '電子郵件格式無效',
      'auth/user-disabled': '此用戶帳號已被停用',
      'auth/too-many-requests': '請求過於頻繁，請稍後再試',
      'auth/network-request-failed': '網路連接失敗',
      'permission-denied': '權限不足',
      'not-found': '找不到請求的資源',
      'already-exists': '資源已存在',
      'failed-precondition': '操作條件不滿足',
      'out-of-range': '參數超出範圍',
      'unauthenticated': '未認證',
      'resource-exhausted': '資源已耗盡',
      'cancelled': '操作已取消',
      'data-loss': '資料遺失',
      'unknown': '未知錯誤',
      'internal': '內部錯誤',
      'unavailable': '服務暫時無法使用',
      'deadline-exceeded': '操作超時'
    };
    
    const errorCode = error?.code || 'unknown';
    return errorMessages[errorCode] || error?.message || '發生未知錯誤';
  },
  
  /**
   * 記錄分析事件
   */
  logEvent: (eventName: string, parameters?: Record<string, any>) => {
    if (analytics && typeof window !== 'undefined') {
      try {
        // 這裡應該使用 Firebase Analytics 的 logEvent 函數
        // import { logEvent } from 'firebase/analytics';
        // logEvent(analytics, eventName, parameters);
        console.log('📊 Analytics Event:', eventName, parameters);
      } catch (error) {
        console.warn('Analytics 事件記錄失敗:', error);
      }
    }
  },
  
  /**
   * 設置用戶屬性
   */
  setUserProperties: (properties: Record<string, any>) => {
    if (analytics && typeof window !== 'undefined') {
      try {
        // 這裡應該使用 Firebase Analytics 的 setUserProperties 函數
        // import { setUserProperties } from 'firebase/analytics';
        // setUserProperties(analytics, properties);
        console.log('👤 User Properties:', properties);
      } catch (error) {
        console.warn('用戶屬性設置失敗:', error);
      }
    }
  }
};

// 默認導出
export default {
  app,
  auth,
  db,
  storage,
  analytics,
  isFirebaseEnabled,
  firebaseUtils
};
