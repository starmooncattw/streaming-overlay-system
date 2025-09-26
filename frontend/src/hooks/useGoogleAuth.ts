import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { googleAuthService, StreamerProfile } from '../services/googleAuthService';

// Google 認證 Hook
export const useGoogleAuth = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StreamerProfile | null>(null);

  // 監聽認證狀態變化
  useEffect(() => {
    const unsubscribe = googleAuthService.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // 用戶已登入
          setUser(firebaseUser);
          
          try {
            // 獲取直播主資料
            const streamerProfile = await googleAuthService.getStreamerProfile(firebaseUser.uid);
            setProfile(streamerProfile);
            console.log('✅ 直播主資料載入成功');
          } catch (error) {
            console.error('獲取直播主資料失敗:', error);
            // 如果獲取資料失敗，清除狀態
            setUser(null);
            setProfile(null);
          }
        } else {
          // 用戶未登入
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('認證狀態處理失敗:', error);
      } finally {
        if (initializing) {
          setInitializing(false);
        }
      }
    });

    // 清理監聽器
    return () => unsubscribe();
  }, [initializing]);

  return {
    user,
    profile,
    initializing,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false
  };
};

export default useGoogleAuth;
