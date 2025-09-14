import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// Context 和 Hooks
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SocketProvider } from './contexts/SocketContext';

// 頁面組件
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StyleSettings from './pages/StyleSettings';
import TestPanel from './pages/TestPanel';

// 顯示頁面 (OBS 使用)
import ChatDisplay from './pages/displays/ChatDisplay';
import DonationDisplay from './pages/displays/DonationDisplay';
import ClockDisplay from './pages/displays/ClockDisplay';
import LoadingDisplay from './pages/displays/LoadingDisplay';

// 佈局組件
import DashboardLayout from './components/layout/DashboardLayout';
import PublicLayout from './components/layout/PublicLayout';

// 載入組件
import LoadingSpinner from './components/ui/LoadingSpinner';

// 建立 React Query 客戶端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 分鐘
    },
  },
});

// 受保護的路由組件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 應用程式路由
const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    // 設定主題類別
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* 公開路由 - 登入頁面 */}
      <Route path="/login" element={
        user ? <Navigate to="/dashboard" replace /> : (
          <PublicLayout>
            <Login />
          </PublicLayout>
        )
      } />

      {/* 受保護的管理頁面 */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/styles" element={
        <ProtectedRoute>
          <DashboardLayout>
            <StyleSettings />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/test" element={
        <ProtectedRoute>
          <DashboardLayout>
            <TestPanel />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* OBS 顯示頁面 - 公開訪問，背景透明 */}
      <Route path="/display/chat/:userId/:styleId" element={<ChatDisplay />} />
      <Route path="/display/donation/:userId/:styleId" element={<DonationDisplay />} />
      <Route path="/display/clock/:userId/:styleId" element={<ClockDisplay />} />
      <Route path="/display/loading/:userId/:styleId" element={<LoadingDisplay />} />

      {/* 預設重導向 */}
      <Route path="/" element={
        user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
      } />

      {/* 404 頁面 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">找不到請求的頁面</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              回到首頁
            </button>
          </div>
        </div>
      } />
    </Routes>
  );
};

// 主應用程式組件
const App: React.FC = () => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <LanguageProvider>
            <ThemeProvider>
              <AuthProvider>
                <SocketProvider>
                  <div className="App">
                    {/* Toast 通知 */}
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: 'var(--toast-bg)',
                          color: 'var(--toast-color)',
                          borderRadius: '8px',
                          fontSize: '14px',
                        },
                        success: {
                          iconTheme: {
                            primary: '#10B981',
                            secondary: '#fff',
                          },
                        },
                        error: {
                          iconTheme: {
                            primary: '#EF4444',
                            secondary: '#fff',
                          },
                        },
                      }}
                    />

                    {/* 主要路由 */}
                    <AppRoutes />
                  </div>
                </SocketProvider>
              </AuthProvider>
            </ThemeProvider>
          </LanguageProvider>
        </Router>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;