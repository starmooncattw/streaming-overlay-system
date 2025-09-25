import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import OverlayView from './pages/OverlayView';
import Settings from './pages/Settings';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Store
import { RootState } from './store/store';
import { checkAuthState } from './store/slices/authSlice';

// Styles
import './App.css';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // 檢查用戶認證狀態
    dispatch(checkAuthState() as any);
  }, [dispatch]);

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="large" />
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* 公開路由 */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
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
        
        {/* 預設重定向 */}
        <Route 
          path="/" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
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
  );
};

export default App;
