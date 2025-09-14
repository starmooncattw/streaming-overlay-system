import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import toast from 'react-hot-toast';
import { api } from '../services/api';

// Firebase 配置
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// 設定 Google 提供者參數
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// 用戶介面定義
export interface User {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  settings: {
    language: 'zh-TW' | 'en';
    theme: 'light' | 'dark';
    timezone: string;
  };
}

// Context 介面定義
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// 建立 Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider 組件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 從 localStorage 獲取 token
  const getStoredToken = (): string | null => {
    return localStorage.getItem('authToken');
  };

  // 儲存 token 到 localStorage
  const setStoredToken = (token: string): void => {
    localStorage.setItem('authToken', token);
  };

  // 移除 token
  const removeStoredToken = (): void => {
    localStorage.removeItem('authToken');
  };

  // 設定 API token
  const setApiToken = (token: string | null): void => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  };

  // Google 登入
  const login = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Firebase Google 登入
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // 發送 ID token 到後端驗證
      const response = await api.post('/auth/google', {
        idToken
      });

      if (response.data.success) {
        const { token, user: userData } = response.data.data;
        
        // 儲存 token 和設定 API header
        setStoredToken(token);
        setApiToken(token);
        
        // 設定用戶狀態
        setUser(userData);
        
        toast.success(
          userData.isNewUser ? 
            '歡迎加入！帳號建立成功' : 
            '登入成功！歡迎回來'
        );
      } else {
        throw new Error(response.data.message || '登入失敗');
      }

    } catch (error: any) {
      console.error('Login error:', error);
      
      // Firebase 登出以清理狀態
      await signOut(auth);
      
      // 清理本地狀態
      removeStoredToken();
      setApiToken(null);
      setUser(null);
      
      // 顯示錯誤訊息
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('登入已取消');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('彈出視窗被阻擋，請允許彈出視窗後重試');
      } else {
        toast.error(error.message || '登入失敗，請稍後重試');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 登出
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // 通知後端登出 (記錄日誌)
      try {
        await api.post('/auth/logout');
      } catch (error) {
        // 忽略後端登出錯誤
        console.warn('Backend logout failed:', error);
      }
      
      // Firebase 登出
      await signOut(auth);
      
      // 清理本地狀態
      removeStoredToken();
      setApiToken(null);
      setUser(null);
      
      toast.success('已成功登出');
      
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('登出時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  // 重新獲取用戶資訊
  const refreshUser = async (): Promise<void> => {
    try {
      const token = getStoredToken();
      if (!token) return;

      setApiToken(token);
      const response = await api.get('/auth/me');

      if (response.data.success) {
        setUser(response.data.data);
      } else {
        throw new Error('Failed to get user info');
      }

    } catch (error: any) {
      console.error('Refresh user error:', error);
      
      // Token 可能過期，清理狀態
      removeStoredToken();
      setApiToken(null);
      setUser(null);
      
      if (error.response?.status === 401) {
        toast.error('登入已過期，請重新登入');
      }
    }
  };

  // 初始化認證狀態
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getStoredToken();
        
        if (token) {
          // 檢查 token 是否有效
          setApiToken(token);
          await refreshUser();
        }
      } catch (error) {
        console.error('Initialize auth error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Firebase 認證狀態監聽
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser: FirebaseUser | null) => {
      // 這裡主要用於監聽 Firebase 狀態變化
      // 實際的用戶狀態由後端 API 管理
      if (!firebaseUser && user) {
        // Firebase 用戶登出但本地還有用戶狀態，可能是異常情況
        console.warn('Firebase user signed out but local user exists');
      }
    });

    return () => unsubscribe();
  }, [user]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};