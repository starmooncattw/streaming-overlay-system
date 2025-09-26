// frontend/src/config/firebase.ts - 生產環境版本（Cloud Shell 適用）
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// 檢查必要的環境變數
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ 缺少必要的 Firebase 環境變數:', missingVars);
  console.error('請檢查 .env 檔案是否正確配置');
}

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

console.log('🔥 Firebase 配置載入:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  environment: 'PRODUCTION (Cloud Shell)'
});

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化服務 - 直接連接線上服務，不使用模擬器
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 分析服務 (僅在生產環境)
export const analytics = typeof window !== 'undefined' && process.env.NODE_ENV === 'production' 
  ? getAnalytics(app) 
  : null;

// ⚠️ 重要：Cloud Shell 環境強制使用線上 Firebase 服務
// 不連接任何模擬器，直接使用 Firebase 線上服務
console.log('🌐 Cloud Shell 環境：直接連接 Firebase 線上服務');
console.log('✅ 跳過模擬器連接，使用生產環境配置');

// 驗證連接狀態
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('✅ Firebase Auth 連接成功，用戶已登入:', user.email);
  } else {
    console.log('ℹ️ Firebase Auth 連接成功，等待用戶登入');
  }
});

// 導出 Firebase 應用實例
export default app;