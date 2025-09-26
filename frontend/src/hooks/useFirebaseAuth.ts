import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useDispatch } from 'react-redux';
import { firebaseAuthService, type UserProfile } from '../services/firebaseAuthService';
import { updateUser, setLoading, logout } from '../store/slices/authSlice';

// Firebase 認證 Hook
export const useFirebaseAuth = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUserState] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const dispatch = useDispatch();

  // 監聽認證狀態變化
  useEffect(() => {
    const unsubscribe = firebaseAuthService.onAuthStateChanged(async (firebaseUser) => {
      try {
        dispatch(setLoading(true));

        if (firebaseUser) {
          // 用戶已登入
          setUserState(firebaseUser);
          // 獲取用戶資料
          try {
            const userProfile = await firebaseAuthService.getUserProfile(firebaseUser.uid);
            setProfile(userProfile);
            
            // 更新 Redux store 中的用戶狀態
            dispatch(updateUser({
              user: {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                username: userProfile.username,
                displayName: userProfile.displayName,
                role: userProfile.role,
                avatar: userProfile.avatar,
                emailVerified: firebaseUser.emailVerified,
                isActive: userProfile.isActive,
                createdAt: userProfile.createdAt,
                lastLoginAt: userProfile.lastLoginAt
              },
              profile: userProfile
            }));
          } catch (error) {
            console.error('獲取用戶資料失敗:', error);
            // 如果獲取資料失敗，清除用戶狀態
            setUserState(null);
            setProfile(null);
            dispatch(logout());
          }
        } else {
          // 用戶未登入
          setUserState(null);
          setProfile(null);
          dispatch(logout());
        }
      } catch (error) {
        console.error('認證狀態處理失敗:', error);
      } finally {
        dispatch(setLoading(false));
        if (initializing) {
          setInitializing(false);
        }
      }
    });

    // 清理監聽器
    return () => unsubscribe();
  }, [dispatch, initializing]);

  return {
    user,
    profile,
    initializing,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false
  };
};

export default useFirebaseAuth;
