import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
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
  const { user, loading, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // 如果正在載入，顯示載入畫面
  if (loading) {
    return <LoadingSpinner fullScreen text="驗證中..." />;
  }

  // 如果未認證，重定向到登入頁面
  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // 如果需要特定角色權限
  if (requiredRole) {
    const roleHierarchy = {
      'admin': 3,
      'streamer': 2,
      'viewer': 1
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    // 權限不足，重定向到無權限頁面
    if (userLevel < requiredLevel) {
      return (
        <div className="unauthorized-container">
          <div className="unauthorized-content">
            <h1>🚫 權限不足</h1>
            <p>您沒有權限訪問此頁面</p>
            <p>需要角色：{requiredRole}</p>
            <p>您的角色：{user.role}</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.history.back()}
            >
              返回上一頁
            </button>
          </div>
        </div>
      );
    }
  }

  // 權限驗證通過，渲染子組件
  return <>{children}</>;
};

export default ProtectedRoute;
