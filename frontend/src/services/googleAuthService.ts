import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
  UserCredential
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// 直播主資料介面
export interface StreamerProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  avatar?: string; // 添加 avatar 屬性
  role: 'admin' | 'streamer' | 'viewer'; // 添加 role 屬性
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  // 直播相關設定
  streamSettings: {
    streamTitle?: string;
    streamDescription?: string;
    overlayEnabled: boolean;
    chatEnabled: boolean;
    donationEnabled: boolean;
  };
  // 社交媒體連結
  socialLinks?: {
    youtube?: string;
    twitch?: string;
    twitter?: string;
    instagram?: string;
  };
}

class GoogleAuthService {
  private provider: GoogleAuthProvider;

  constructor() {
    this.provider = new GoogleAuthProvider();
    // 設定 Google 登入範圍
    this.provider.addScope('email');
    this.provider.addScope('profile');
    
    // 設定自定義參數
    this.provider.setCustomParameters({
      prompt: 'select_account' // 總是顯示帳號選擇器
    });
  }

  // Google 登入
  async signInWithGoogle(): Promise<{ user: User; profile: StreamerProfile }> {
    try {
      const result: UserCredential = await signInWithPopup(auth, this.provider);
      const user = result.user;

      // 檢查是否為新用戶
      const userDoc = await getDoc(doc(db, 'streamers', user.uid));
      
      let profile: StreamerProfile;
      
      if (!userDoc.exists()) {
        // 新用戶 - 創建資料
        profile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '未命名直播主',
          photoURL: user.photoURL || undefined,
          avatar: user.photoURL || undefined, // 設定 avatar
          role: 'streamer', // 預設角色為 streamer
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
          lastLoginAt: serverTimestamp() as Timestamp,
          streamSettings: {
            overlayEnabled: true,
            chatEnabled: true,
            donationEnabled: false
          }
        };
        
        await setDoc(doc(db, 'streamers', user.uid), profile);
        console.log('✅ 新直播主資料已創建');
      } else {
        // 現有用戶 - 更新登入時間
        profile = userDoc.data() as StreamerProfile;
        
        // 確保舊用戶也有 role 和 avatar 屬性
        if (!profile.role) {
          profile.role = 'streamer';
        }
        if (!profile.avatar && user.photoURL) {
          profile.avatar = user.photoURL;
        }
        
        await updateDoc(doc(db, 'streamers', user.uid), {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          avatar: profile.avatar,
          role: profile.role
        });
        console.log('✅ 直播主資料已更新');
      }

      return { user, profile };
    } catch (error: any) {
      console.error('Google 登入失敗:', error);
      throw this.handleAuthError(error);
    }
  }

  // 登出
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      console.log('✅ 已成功登出');
    } catch (error: any) {
      console.error('登出失敗:', error);
      throw this.handleAuthError(error);
    }
  }

  // 獲取直播主資料
  async getStreamerProfile(uid: string): Promise<StreamerProfile> {
    try {
      const userDoc = await getDoc(doc(db, 'streamers', uid));
      if (!userDoc.exists()) {
        throw new Error('找不到直播主資料');
      }
      const profile = userDoc.data() as StreamerProfile;
      
      // 確保所有必要屬性存在
      if (!profile.role) {
        profile.role = 'streamer';
      }
      if (!profile.avatar && profile.photoURL) {
        profile.avatar = profile.photoURL;
      }
      
      return profile;
    } catch (error: any) {
      console.error('獲取直播主資料失敗:', error);
      throw error;
    }
  }

  // 更新直播主資料
  async updateStreamerProfile(uid: string, updates: Partial<StreamerProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'streamers', uid), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('✅ 直播主資料已更新');
    } catch (error: any) {
      console.error('更新直播主資料失敗:', error);
      throw error;
    }
  }

  // 監聽認證狀態變化
  onAuthStateChanged(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged(callback);
  }

  // 錯誤處理
  private handleAuthError(error: any): Error {
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        return new Error('登入視窗被關閉，請重試');
      case 'auth/popup-blocked':
        return new Error('登入彈窗被阻擋，請允許彈窗並重試');
      case 'auth/cancelled-popup-request':
        return new Error('登入請求被取消');
      case 'auth/network-request-failed':
        return new Error('網路連接失敗，請檢查網路連接');
      case 'auth/too-many-requests':
        return new Error('登入嘗試次數過多，請稍後再試');
      default:
        return new Error(error.message || '登入失敗，請重試');
    }
  }
}

// 導出單例
export const googleAuthService = new GoogleAuthService();
export default googleAuthService;
