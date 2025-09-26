import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import FirebaseLogin from './pages/FirebaseLogin';
import OverlayView from './pages/OverlayView';
import Settings from './pages/Settings';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';

// Hooks
import useFirebaseAuth from './hooks/useFirebaseAuth';

// Store
import { RootState } from './store/store';

// Styles
import './App.css';

const App: React.FC = () => {
  const { user, initializing, isAuthenticated } = useFirebaseAuth();

  // 如果正在初始化，顯示載入畫面
  if (initializing) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="large" />
        <p>初始化中...</p>
      </div>
    );
  }

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
          {/* 公開路由 */}
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <FirebaseLogin />} 
          />
          
          {/* 傳統登入頁面 (備用) */}
          <Route 
            path="/login-legacy" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          
          {/* OBS 疊加視圖 - 不需要認證 */}
          <Route path="/overlay/:streamerId" element={<OverlayView />} />
          
          {/* 受保護的路由 */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          {/* 個人資料頁面 */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
                <h1>個人資料頁面</h1>
                <p>此頁面正在開發中...</p>
              </div>
            </ProtectedRoute>
          } />

          {/* 直播管理頁面 */}
          <Route path="/stream" element={
            <ProtectedRoute requiredRole="streamer">
              <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
                <h1>直播管理</h1>
                <p>此頁面正在開發中...</p>
              </div>
            </ProtectedRoute>
          } />

          {/* 疊加層編輯器 */}
          <Route path="/overlay" element={
            <ProtectedRoute requiredRole="streamer">
              <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
                <h1>疊加層編輯器</h1>
                <p>此頁面正在開發中...</p>
              </div>
            </ProtectedRoute>
          } />

          {/* 捐款管理 */}
          <Route path="/donations" element={
            <ProtectedRoute requiredRole="streamer">
              <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
                <h1>捐款管理</h1>
                <p>此頁面正在開發中...</p>
              </div>
            </ProtectedRoute>
          } />

          {/* 系統管理 */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
                <h1>系統管理</h1>
                <p>此頁面正在開發中...</p>
              </div>
            </ProtectedRoute>
          } />

          {/* 分析報告 */}
          <Route path="/analytics" element={
            <ProtectedRoute requiredRole="admin">
              <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
                <h1>分析報告</h1>
                <p>此頁面正在開發中...</p>
              </div>
            </ProtectedRoute>
          } />

          {/* 幫助中心 */}
          <Route path="/help" element={
            <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
              <h1>幫助中心</h1>
              <p>此頁面正在開發中...</p>
            </div>
          } />
          
          {/* 預設重定向 */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } 
          />
          
          {/* 404 處理 */}
          <Route path="*" element={
            <div className="not-found">
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
