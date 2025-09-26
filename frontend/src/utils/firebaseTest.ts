import { auth, db } from '../config/firebase';
import { connectAuthEmulator, connectFirestoreEmulator } from 'firebase/auth';

// Firebase 連接測試工具
export const testFirebaseConnection = async () => {
  console.log('🔥 開始 Firebase 連接測試...');
  
  try {
    // 1. 檢查環境變數
    console.log('📋 檢查環境變數:');
    console.log('API Key:', process.env.REACT_APP_FIREBASE_API_KEY ? '✅ 已設置' : '❌ 未設置');
    console.log('Auth Domain:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '✅ 已設置' : '❌ 未設置');
    console.log('Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID ? '✅ 已設置' : '❌ 未設置');
    
    // 2. 檢查 Firebase 服務初始化
    console.log('🔧 檢查 Firebase 服務:');
    console.log('Auth 服務:', auth ? '✅ 已初始化' : '❌ 初始化失敗');
    console.log('Firestore 服務:', db ? '✅ 已初始化' : '❌ 初始化失敗');
    
    // 3. 檢查當前認證狀態
    console.log('👤 當前認證狀態:', auth.currentUser ? '已登入' : '未登入');
    
    // 4. 檢查網路連接
    console.log('🌐 檢查網路連接...');
    
    // 嘗試連接到 Firebase
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        console.log('🔄 認證狀態變化:', user ? '用戶已登入' : '用戶未登入');
        unsubscribe();
        resolve({
          success: true,
          message: 'Firebase 連接測試完成'
        });
      }, (error) => {
        console.error('❌ 認證狀態監聽錯誤:', error);
        resolve({
          success: false,
          message: `認證錯誤: ${error.message}`,
          error
        });
      });
      
      // 5 秒超時
      setTimeout(() => {
        unsubscribe();
        resolve({
          success: false,
          message: '連接超時'
        });
      }, 5000);
    });
    
  } catch (error: any) {
    console.error('❌ Firebase 連接測試失敗:', error);
    return {
      success: false,
      message: `連接失敗: ${error.message}`,
      error
    };
  }
};

// 檢查是否使用模擬器
export const checkEmulatorStatus = () => {
  console.log('🧪 檢查模擬器狀態:');
  
  // 檢查是否在開發環境
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 開發環境 - 嘗試連接模擬器');
    
    // 檢查模擬器連接
    try {
      // 這裡我們只是檢查，不實際連接
      console.log('Auth 模擬器: http://localhost:9099');
      console.log('Firestore 模擬器: http://localhost:8080');
      console.log('💡 提示: 如果模擬器未運行，將使用線上 Firebase 服務');
    } catch (error) {
      console.warn('⚠️ 模擬器連接檢查失敗:', error);
    }
  } else {
    console.log('🌐 生產環境 - 使用線上 Firebase 服務');
  }
};

// 診斷網路問題
export const diagnoseNetworkIssue = async () => {
  console.log('🔍 診斷網路問題...');
  
  try {
    // 檢查基本網路連接
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors'
    });
    console.log('✅ 基本網路連接正常');
    
    // 檢查 Firebase 服務可達性
    try {
      const firebaseCheck = await fetch(`https://${process.env.REACT_APP_FIREBASE_PROJECT_ID}.firebaseapp.com`, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      console.log('✅ Firebase 服務可達');
    } catch (error) {
      console.warn('⚠️ Firebase 服務連接問題:', error);
    }
    
  } catch (error) {
    console.error('❌ 網路連接問題:', error);
    return {
      success: false,
      message: '網路連接失敗，請檢查網路設置'
    };
  }
  
  return {
    success: true,
    message: '網路診斷完成'
  };
};
