import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import EnhancedDashboard from './pages/EnhancedDashboard';
import GoogleLogin from './pages/GoogleLogin';
import OverlayView from './pages/OverlayView';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';

// Hooks
import useFirebaseAuth from './hooks/useFirebaseAuth';

// Styles
import './App.css';

const App: React.FC = () => {
  const { initializing, isAuthenticated } = useFirebaseAuth();
  const location = useLocation();

  // 檢查是否為 overlay 路由
  const isOverlayRoute = location.pathname.startsWith('/overlay');

  // 設定 body 透明背景 (針對 overlay 路由)
  React.useEffect(() => {
    if (isOverlayRoute) {
      document.body.style.background = 'transparent';
      return () => {
        document.body.style.background = '';
      };
    }
  }, [isOverlayRoute]);

  // 如果正在初始化,顯示載入畫面 (但 overlay 路由除外)
  if (initializing && !isOverlayRoute) {
    return (
      <div className="app-loading" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        color: 'white'
      }}>
        <LoadingSpinner size="large" />
        <p>初始化中...</p>
      </div>
    );
  }

  // OBS Overlay 路由 - 完全獨立，無任何 UI 元素
  if (isOverlayRoute) {
    return (
      <Routes>
        <Route path="/overlay/:streamerId" element={<OverlayView />} />
      </Routes>
    );
  }

  // 其他所有路由都包含完整的 UI
  return (
    <div className="App">
      {/* Toast 通知 */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(15, 15, 35, 0.95)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            backdropFilter: 'blur(20px)'
          }
        }}
      />

      {/* 導航欄 - 僅在認證後顯示 */}
      {isAuthenticated && <Navbar />}

      {/* 主要內容區域 */}
      <div style={{ paddingTop: isAuthenticated ? '70px' : '0' }}>
        <Routes>
          {/* Google 登入頁面 */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <GoogleLogin />}
          />

          {/* 受保護的路由 */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <EnhancedDashboard />
            </ProtectedRoute>
          } />

          {/* 預設重定向 - 只在非初始化狀態下進行 */}
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
          />

          {/* 404 處理 */}
          <Route path="*" element={
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'white',
              background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <h1>404 - 頁面不存在</h1>
              <p>您訪問的頁面不存在</p>
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
};

export default App;
