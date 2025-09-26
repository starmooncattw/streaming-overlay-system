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

// 類型定義
export interface OverlayComponent {
  id: string;
  type: 'donationAlert' | 'viewerCount' | 'latestFollower' | 'chatBox' | 'donationGoal' | 'custom';
  enabled: boolean;
  position: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  };
  style: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
    opacity?: number;
  };
  animation?: {
    type: 'none' | 'fadeIn' | 'slideIn' | 'bounce' | 'pulse';
    duration: number;
    delay?: number;
  };
  settings: Record<string, any>;
}

export interface OverlayConfig {
  streamerId: string;
  theme: 'light' | 'dark' | 'custom';
  components: OverlayComponent[];
  customCSS: string;
  globalSettings: {
    fontFamily: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    borderRadius: number;
  };
  lastUpdated: string;
}

// 疊加層服務類
class OverlayService {
  /**
   * 獲取疊加層配置
   */
  async getOverlayConfig(streamerId: string): Promise<OverlayConfig> {
    try {
      const response: AxiosResponse<{ success: boolean; data: OverlayConfig }> = 
        await apiClient.get(`/overlay/${streamerId}`);
      
      if (!response.data.success) {
        throw new Error('獲取疊加層配置失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '獲取疊加層配置失敗');
    }
  }

  /**
   * 更新疊加層配置
   */
  async updateOverlayConfig(streamerId: string, config: Partial<OverlayConfig>): Promise<OverlayConfig> {
    try {
      const response: AxiosResponse<{ success: boolean; data: OverlayConfig }> = 
        await apiClient.put(`/overlay/${streamerId}`, config);
      
      if (!response.data.success) {
        throw new Error('更新疊加層配置失敗');
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
      throw new Error(error.message || '更新疊加層配置失敗');
    }
  }

  /**
   * 獲取疊加層模板
   */
  async getOverlayTemplates(): Promise<OverlayComponent[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: OverlayComponent[] }> = 
        await apiClient.get('/overlay/templates');
      
      if (!response.data.success) {
        throw new Error('獲取疊加層模板失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '獲取疊加層模板失敗');
    }
  }

  /**
   * 創建自定義組件
   */
  async createCustomComponent(streamerId: string, component: Omit<OverlayComponent, 'id'>): Promise<OverlayComponent> {
    try {
      const response: AxiosResponse<{ success: boolean; data: OverlayComponent }> = 
        await apiClient.post(`/overlay/${streamerId}/components`, component);
      
      if (!response.data.success) {
        throw new Error('創建自定義組件失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '創建自定義組件失敗');
    }
  }

  /**
   * 更新組件設定
   */
  async updateComponent(streamerId: string, componentId: string, updates: Partial<OverlayComponent>): Promise<OverlayComponent> {
    try {
      const response: AxiosResponse<{ success: boolean; data: OverlayComponent }> = 
        await apiClient.put(`/overlay/${streamerId}/components/${componentId}`, updates);
      
      if (!response.data.success) {
        throw new Error('更新組件設定失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '更新組件設定失敗');
    }
  }

  /**
   * 刪除組件
   */
  async deleteComponent(streamerId: string, componentId: string): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: { message: string } }> = 
        await apiClient.delete(`/overlay/${streamerId}/components/${componentId}`);
      
      if (!response.data.success) {
        throw new Error('刪除組件失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '刪除組件失敗');
    }
  }

  /**
   * 測試疊加層組件
   */
  async testOverlayComponent(streamerId: string, componentId: string, testData?: any): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: { message: string } }> = 
        await apiClient.post(`/overlay/${streamerId}/components/${componentId}/test`, testData || {});
      
      if (!response.data.success) {
        throw new Error('測試疊加層組件失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '測試疊加層組件失敗');
    }
  }

  /**
   * 獲取疊加層預覽 URL
   */
  getOverlayPreviewUrl(streamerId: string, options?: {
    theme?: string;
    preview?: boolean;
  }): string {
    const baseUrl = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';
    const queryParams = new URLSearchParams();
    
    if (options?.theme) queryParams.append('theme', options.theme);
    if (options?.preview) queryParams.append('preview', 'true');
    
    const queryString = queryParams.toString();
    return `${baseUrl}/overlay/${streamerId}${queryString ? `?${queryString}` : ''}`;
  }

  /**
   * 獲取 OBS 瀏覽器源 URL
   */
  getOBSBrowserSourceUrl(streamerId: string): string {
    const baseUrl = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/overlay/${streamerId}`;
  }

  /**
   * 導出疊加層配置
   */
  async exportOverlayConfig(streamerId: string, format: 'json' | 'obs'): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `/overlay/${streamerId}/export?format=${format}`,
        { responseType: 'blob' }
      );
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || '導出疊加層配置失敗');
    }
  }

  /**
   * 導入疊加層配置
   */
  async importOverlayConfig(streamerId: string, configFile: File): Promise<OverlayConfig> {
    try {
      const formData = new FormData();
      formData.append('config', configFile);

      const response: AxiosResponse<{ success: boolean; data: OverlayConfig }> = 
        await apiClient.post(`/overlay/${streamerId}/import`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      
      if (!response.data.success) {
        throw new Error('導入疊加層配置失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '導入疊加層配置失敗');
    }
  }

  /**
   * 重置疊加層配置為預設值
   */
  async resetOverlayConfig(streamerId: string): Promise<OverlayConfig> {
    try {
      const response: AxiosResponse<{ success: boolean; data: OverlayConfig }> = 
        await apiClient.post(`/overlay/${streamerId}/reset`);
      
      if (!response.data.success) {
        throw new Error('重置疊加層配置失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '重置疊加層配置失敗');
    }
  }

  /**
   * 獲取疊加層使用統計
   */
  async getOverlayStats(streamerId: string): Promise<{
    totalViews: number;
    activeComponents: number;
    lastUpdated: string;
    performanceMetrics: {
      loadTime: number;
      renderTime: number;
      memoryUsage: number;
    };
    componentUsage: Array<{
      componentType: string;
      usageCount: number;
      averageDisplayTime: number;
    }>;
  }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any }> = 
        await apiClient.get(`/overlay/${streamerId}/stats`);
      
      if (!response.data.success) {
        throw new Error('獲取疊加層統計失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '獲取疊加層統計失敗');
    }
  }

  /**
   * 驗證疊加層配置
   */
  async validateOverlayConfig(config: OverlayConfig): Promise<{
    isValid: boolean;
    errors: Array<{
      componentId?: string;
      field: string;
      message: string;
      severity: 'error' | 'warning';
    }>;
    warnings: Array<{
      componentId?: string;
      field: string;
      message: string;
    }>;
  }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any }> = 
        await apiClient.post('/overlay/validate', config);
      
      if (!response.data.success) {
        throw new Error('驗證疊加層配置失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '驗證疊加層配置失敗');
    }
  }

  /**
   * 獲取疊加層主題列表
   */
  async getOverlayThemes(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    preview: string;
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
    };
    components: string[];
  }>> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any }> = 
        await apiClient.get('/overlay/themes');
      
      if (!response.data.success) {
        throw new Error('獲取疊加層主題失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '獲取疊加層主題失敗');
    }
  }

  /**
   * 應用疊加層主題
   */
  async applyOverlayTheme(streamerId: string, themeId: string): Promise<OverlayConfig> {
    try {
      const response: AxiosResponse<{ success: boolean; data: OverlayConfig }> = 
        await apiClient.post(`/overlay/${streamerId}/apply-theme`, { themeId });
      
      if (!response.data.success) {
        throw new Error('應用疊加層主題失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '應用疊加層主題失敗');
    }
  }
}

// 導出單例實例
export const overlayService = new OverlayService();
export default overlayService;
