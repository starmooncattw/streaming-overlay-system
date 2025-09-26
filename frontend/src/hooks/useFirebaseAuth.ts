import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { googleAuthService, StreamerProfile } from '../services/googleAuthService';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Google 認證 Hook
export const useFirebaseAuth = () => {
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
            // 嘗試獲取直播主資料
            const streamerProfile = await googleAuthService.getStreamerProfile(firebaseUser.uid);
            setProfile(streamerProfile);
            console.log('✅ 直播主資料載入成功');
          } catch (error) {
            console.log('⚠️ 用戶資料不存在，建立新資料...');
            
            // 如果用戶資料不存在，建立新的
            const newProfile: StreamerProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '未命名用戶',
              photoURL: firebaseUser.photoURL || undefined,
              avatar: firebaseUser.photoURL || undefined,
              role: 'streamer', // 添加缺少的 role 屬性
              createdAt: serverTimestamp() as any,
              updatedAt: serverTimestamp() as any,
              lastLoginAt: serverTimestamp() as any,
              streamSettings: {
                overlayEnabled: true,
                chatEnabled: true,
                donationEnabled: false
              }
            };
            
            // 儲存到 Firestore
            await setDoc(doc(db, 'streamers', firebaseUser.uid), newProfile);
            setProfile(newProfile);
            console.log('✅ 新用戶資料已建立');
          }
        } else {
          // 用戶未登入
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('認證狀態處理失敗:', error);
        setUser(null);
        setProfile(null);
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

export default useFirebaseAuth;
