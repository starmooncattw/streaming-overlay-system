import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
  UserCredential,
  AuthError
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

// 用戶資料介面
export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  role: 'admin' | 'streamer' | 'viewer';
  avatar?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  emailVerified: boolean;
  isActive: boolean;
  preferences?: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  };
}

// 註冊資料介面
export interface RegisterData {
  email: string;
  password: string;
  username: string;
  role: 'streamer' | 'viewer';
  displayName?: string;
}

// 登入資料介面
export interface LoginData {
  email: string;
  password: string;
}

// Firebase 認證服務類別
class FirebaseAuthService {
  /**
   * 用戶註冊
   */
  async register(data: RegisterData): Promise<{ user: User; profile: UserProfile }> {
    try {
      // 建立 Firebase 認證用戶
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const user = userCredential.user;

      // 更新用戶顯示名稱
      await updateProfile(user, {
        displayName: data.displayName || data.username
      });

      // 建立用戶資料文檔
      const userProfile: UserProfile = {
        uid: user.uid,
        email: data.email,
        username: data.username,
        displayName: data.displayName || data.username,
        role: data.role,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        emailVerified: false,
        isActive: true,
        preferences: {
          theme: 'dark',
          language: 'zh-TW',
          notifications: true
        }
      };

      // 儲存到 Firestore
      await setDoc(doc(db, 'users', user.uid), userProfile);

      // 發送郵件驗證
      await sendEmailVerification(user);

      return { user, profile: userProfile };
    } catch (error) {
      console.error('註冊失敗:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * 用戶登入
   */
  async login(data: LoginData): Promise<{ user: User; profile: UserProfile }> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const user = userCredential.user;

      // 更新最後登入時間
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 獲取用戶資料
      const profile = await this.getUserProfile(user.uid);

      return { user, profile };
    } catch (error) {
      console.error('登入失敗:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * 用戶登出
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('登出失敗:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * 獲取用戶資料
   */
  async getUserProfile(uid: string): Promise<UserProfile> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (!userDoc.exists()) {
        throw new Error('用戶資料不存在');
      }

      return userDoc.data() as UserProfile;
    } catch (error) {
      console.error('獲取用戶資料失敗:', error);
      throw error;
    }
  }

  /**
   * 更新用戶資料
   */
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('更新用戶資料失敗:', error);
      throw error;
    }
  }

  /**
   * 發送密碼重設郵件
   */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('發送密碼重設郵件失敗:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * 更改密碼
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('用戶未登入');
      }

      // 重新認證
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 更新密碼
      await updatePassword(user, newPassword);

      // 更新用戶資料時間戳
      await updateDoc(doc(db, 'users', user.uid), {
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('更改密碼失敗:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * 重新發送郵件驗證
   */
  async resendEmailVerification(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('用戶未登入');
      }

      await sendEmailVerification(user);
    } catch (error) {
      console.error('重新發送郵件驗證失敗:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * 檢查用戶名是否可用
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      // 這裡可以實現更複雜的用戶名檢查邏輯
      // 目前簡單檢查長度和格式
      if (username.length < 3 || username.length > 20) {
        return false;
      }

      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      return usernameRegex.test(username);
    } catch (error) {
      console.error('檢查用戶名失敗:', error);
      return false;
    }
  }

  /**
   * 處理 Firebase 認證錯誤
   */
  private handleAuthError(error: AuthError): Error {
    let message = '發生未知錯誤';

    switch (error.code) {
      case 'auth/user-not-found':
        message = '用戶不存在';
        break;
      case 'auth/wrong-password':
        message = '密碼錯誤';
        break;
      case 'auth/email-already-in-use':
        message = '電子郵件已被使用';
        break;
      case 'auth/weak-password':
        message = '密碼強度不足';
        break;
      case 'auth/invalid-email':
        message = '電子郵件格式無效';
        break;
      case 'auth/user-disabled':
        message = '用戶帳號已被停用';
        break;
      case 'auth/too-many-requests':
        message = '請求過於頻繁，請稍後再試';
        break;
      case 'auth/network-request-failed':
        message = '網路連接失敗';
        break;
      case 'auth/requires-recent-login':
        message = '需要重新登入以執行此操作';
        break;
      default:
        message = error.message || '認證失敗';
    }

    return new Error(message);
  }

  /**
   * 獲取當前用戶
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * 監聽認證狀態變化
   */
  onAuthStateChanged(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged(callback);
  }
}

// 導出服務實例
export const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;
