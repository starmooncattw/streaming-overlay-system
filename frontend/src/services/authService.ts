import axios, { AxiosResponse } from 'axios';

// API 基礎配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// 創建 axios 實例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器 - 添加認證令牌
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器 - 處理令牌刷新
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await authService.refreshToken(refreshToken);
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
          
          // 重新發送原始請求
          originalRequest.headers.Authorization = `Bearer ${response.token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // 刷新失敗，清除令牌並重定向到登入頁面
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// 類型定義
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'streamer' | 'viewer';
  streamerId?: string;
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

// 認證服務類
class AuthService {
  /**
   * 用戶登入
   */
  async login(credentials: LoginData): Promise<LoginResponse> {
    try {
      const response: AxiosResponse<{ success: boolean; data: LoginResponse }> = 
        await apiClient.post('/auth/login', credentials);
      
      if (!response.data.success) {
        throw new Error('登入失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '登入失敗');
    }
  }

  /**
   * 用戶註冊
   */
  async register(userData: RegisterData): Promise<LoginResponse> {
    try {
      const response: AxiosResponse<{ success: boolean; data: LoginResponse }> = 
        await apiClient.post('/auth/register', userData);
      
      if (!response.data.success) {
        throw new Error('註冊失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      if (error.response?.data?.error?.details) {
        const details = error.response.data.error.details;
        const messages = details.map((detail: any) => detail.msg).join(', ');
        throw new Error(messages);
      }
      throw new Error(error.message || '註冊失敗');
    }
  }

  /**
   * 獲取當前用戶資訊
   */
  async getCurrentUser(): Promise<{ user: User }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: { user: User } }> = 
        await apiClient.get('/auth/me');
      
      if (!response.data.success) {
        throw new Error('獲取用戶資訊失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '獲取用戶資訊失敗');
    }
  }

  /**
   * 刷新認證令牌
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response: AxiosResponse<{ success: boolean; data: RefreshTokenResponse }> = 
        await apiClient.post('/auth/refresh', { refreshToken });
      
      if (!response.data.success) {
        throw new Error('令牌刷新失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '令牌刷新失敗');
    }
  }

  /**
   * 修改密碼
   */
  async changePassword(passwordData: ChangePasswordData): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: { message: string } }> = 
        await apiClient.put('/auth/change-password', passwordData);
      
      if (!response.data.success) {
        throw new Error('密碼修改失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      if (error.response?.data?.error?.details) {
        const details = error.response.data.error.details;
        const messages = details.map((detail: any) => detail.msg).join(', ');
        throw new Error(messages);
      }
      throw new Error(error.message || '密碼修改失敗');
    }
  }

  /**
   * 用戶登出
   */
  async logout(): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: { message: string } }> = 
        await apiClient.post('/auth/logout');
      
      if (!response.data.success) {
        throw new Error('登出失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '登出失敗');
    }
  }

  /**
   * 檢查令牌是否有效
   */
  isTokenValid(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      // 簡單的 JWT 解析（不驗證簽名）
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // 檢查是否過期
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * 獲取當前用戶角色
   */
  getCurrentUserRole(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 獲取當前用戶 ID
   */
  getCurrentUserId(): number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 獲取當前用戶的 StreamerId
   */
  getCurrentStreamerId(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.streamerId || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 檢查用戶是否有特定權限
   */
  hasPermission(requiredRole: string): boolean {
    const userRole = this.getCurrentUserRole();
    if (!userRole) return false;

    // 權限層級：admin > streamer > viewer
    const roleHierarchy = {
      'admin': 3,
      'streamer': 2,
      'viewer': 1
    };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  }

  /**
   * 清除認證資訊
   */
  clearAuth(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
}

// 導出單例實例
export const authService = new AuthService();
export default authService;
