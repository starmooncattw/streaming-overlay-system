import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useFirebaseAuth from '../../hooks/useFirebaseAuth';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'streamer' | 'viewer';
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/login'
}) => {
  const location = useLocation();
  const { user, profile, initializing, isAuthenticated } = useFirebaseAuth();

  // 如果正在初始化，顯示載入畫面
  if (initializing) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        color: 'white'
      }}>
        <LoadingSpinner size="large" />
        <p>載入中...</p>
      </div>
    );
  }

  // 如果未認證，重定向到登入頁面
  if (!isAuthenticated || !user || !profile) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // 如果需要特定角色權限
  if (requiredRole) {
    const roleHierarchy = {
      'admin': 3,
      'streamer': 2,
      'viewer': 1
    };

    const userLevel = roleHierarchy[profile.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    // 權限不足，顯示無權限頁面
    if (userLevel < requiredLevel) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
          color: 'white',
          textAlign: 'center'
        }}>
          <h1>🚫 權限不足</h1>
          <p>您沒有權限訪問此頁面</p>
          <p>需要角色：{requiredRole}</p>
          <p>您的角色：{profile.role}</p>
          <button 
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
            onClick={() => window.history.back()}
          >
            返回上一頁
          </button>
        </div>
      );
    }
  }

  // 權限驗證通過，渲染子組件
  return <>{children}</>;
};

export default ProtectedRoute;
