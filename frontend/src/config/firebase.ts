import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
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

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化服務
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 分析服務 (僅在生產環境)
export const analytics = typeof window !== 'undefined' && process.env.NODE_ENV === 'production' 
  ? getAnalytics(app) 
  : null;

// 開發環境模擬器設定
if (process.env.NODE_ENV === 'development') {
  const isEmulatorConnected = {
    auth: false,
    firestore: false,
    storage: false
  };

  // Auth 模擬器
  if (!isEmulatorConnected.auth) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      isEmulatorConnected.auth = true;
      console.log('🔥 Firebase Auth 模擬器已連接');
    } catch (error) {
      console.warn('Firebase Auth 模擬器連接失敗，使用線上服務');
    }
  }

  // Firestore 模擬器
  if (!isEmulatorConnected.firestore) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      isEmulatorConnected.firestore = true;
      console.log('🔥 Firebase Firestore 模擬器已連接');
    } catch (error) {
      console.warn('Firebase Firestore 模擬器連接失敗，使用線上服務');
    }
  }

  // Storage 模擬器
  if (!isEmulatorConnected.storage) {
    try {
      connectStorageEmulator(storage, 'localhost', 9199);
      isEmulatorConnected.storage = true;
      console.log('🔥 Firebase Storage 模擬器已連接');
    } catch (error) {
      console.warn('Firebase Storage 模擬器連接失敗，使用線上服務');
    }
  }
}

// 導出 Firebase 應用實例
export default app;
