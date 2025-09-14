import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { logger } from './logger';

let admin: any = null;

export async function initializeFirebase(): Promise<void> {
  try {
    // 檢查是否已經初始化
    if (getApps().length > 0) {
      admin = require('firebase-admin');
      logger.info('Firebase Admin 已經初始化');
      return;
    }

    // 從環境變數取得 Firebase 設定
    const firebaseConfig = getFirebaseConfig();
    
    if (!firebaseConfig) {
      throw new Error('Firebase 設定不完整');
    }

    // 初始化 Firebase Admin
    initializeApp(firebaseConfig);
    admin = require('firebase-admin');
    
    // 測試連線
    await getAuth().listUsers(1);
    
    logger.info('Firebase Admin 初始化成功');
    
  } catch (error) {
    logger.error('Firebase Admin 初始化失敗:', error);
    throw error;
  }
}

function getFirebaseConfig() {
  // 方法 1: 使用服務帳號密鑰檔案
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      return {
        credential: cert(serviceAccount)
      };
    } catch (error) {
      logger.error('解析 Firebase 服務帳號密鑰失敗:', error);
    }
  }

  // 方法 2: 使用個別環境變數
  if (process.env.FIREBASE_PROJECT_ID && 
      process.env.FIREBASE_PRIVATE_KEY && 
      process.env.FIREBASE_CLIENT_EMAIL) {
    
    return {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      })
    };
  }

  // 方法 3: 在 Google Cloud 環境中使用預設憑證
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCLOUD_PROJECT) {
    return {}; // 使用預設憑證
  }

  logger.warn('未找到 Firebase 設定，將使用預設設定');
  return null;
}

// 驗證 Firebase ID Token
export async function verifyFirebaseToken(idToken: string): Promise<any> {
  try {
    if (!admin) {
      throw new Error('Firebase Admin 未初始化');
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    logger.debug(`Firebase token 驗證成功: ${decodedToken.uid}`);
    return decodedToken;
    
  } catch (error) {
    logger.error('Firebase token 驗證失敗:', error);
    throw error;
  }
}

// 取得使用者資訊
export async function getFirebaseUser(uid: string): Promise<any> {
  try {
    if (!admin) {
      throw new Error('Firebase Admin 未初始化');
    }

    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
    
  } catch (error) {
    logger.error('取得 Firebase 使用者失敗:', error);
    throw error;
  }
}

// 建立自訂 Token
export async function createCustomToken(uid: string, additionalClaims?: object): Promise<string> {
  try {
    if (!admin) {
      throw new Error('Firebase Admin 未初始化');
    }

    const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
    logger.debug(`自訂 token 建立成功: ${uid}`);
    return customToken;
    
  } catch (error) {
    logger.error('建立自訂 token 失敗:', error);
    throw error;
  }
}

// 撤銷使用者的所有 refresh token
export async function revokeRefreshTokens(uid: string): Promise<void> {
  try {
    if (!admin) {
      throw new Error('Firebase Admin 未初始化');
    }

    await admin.auth().revokeRefreshTokens(uid);
    logger.info(`使用者 refresh token 已撤銷: ${uid}`);
    
  } catch (error) {
    logger.error('撤銷 refresh token 失敗:', error);
    throw error;
  }
}

// 設定自訂聲明
export async function setCustomUserClaims(uid: string, customClaims: object): Promise<void> {
  try {
    if (!admin) {
      throw new Error('Firebase Admin 未初始化');
    }

    await admin.auth().setCustomUserClaims(uid, customClaims);
    logger.debug(`自訂聲明已設定: ${uid}`);
    
  } catch (error) {
    logger.error('設定自訂聲明失敗:', error);
    throw error;
  }
}

export { admin };