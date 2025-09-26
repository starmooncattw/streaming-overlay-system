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
export interface StreamInfo {
  streamerId: string;
  title: string;
  description: string;
  isLive: boolean;
  viewerCount: number;
  startTime: string;
  category: string;
  tags: string[];
  overlaySettings: {
    showDonations: boolean;
    showViewerCount: boolean;
    showLatestFollower: boolean;
    theme: string;
  };
}

export interface StreamStats {
  streamerId: string;
  timestamp: string;
  viewers: {
    current: number;
    peak: number;
    total: number;
  };
  donations: {
    todayTotal: number;
    todayCount: number;
    monthlyTotal: number;
    currency: string;
  };
  engagement: {
    chatMessages: number;
    likes: number;
    shares: number;
  };
  streamInfo: {
    duration: number;
    isLive: boolean;
    quality: string;
    bitrate: number;
  };
}

export interface StreamSettings {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  overlaySettings?: Partial<StreamInfo['overlaySettings']>;
}

// 直播服務類
class StreamService {
  /**
   * 獲取直播間資訊
   */
  async getStreamInfo(streamerId: string): Promise<StreamInfo> {
    try {
      const response: AxiosResponse<{ success: boolean; data: StreamInfo }> = 
        await apiClient.get(`/streams/${streamerId}`);
      
      if (!response.data.success) {
        throw new Error('獲取直播資訊失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '獲取直播資訊失敗');
    }
  }

  /**
   * 更新直播間設定
   */
  async updateStreamSettings(streamerId: string, settings: StreamSettings): Promise<StreamInfo> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any }> = 
        await apiClient.put(`/streams/${streamerId}`, settings);
      
      if (!response.data.success) {
        throw new Error('更新直播設定失敗');
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
      throw new Error(error.message || '更新直播設定失敗');
    }
  }

  /**
   * 獲取直播統計資料
   */
  async getStreamStats(streamerId: string): Promise<StreamStats> {
    try {
      const response: AxiosResponse<{ success: boolean; data: StreamStats }> = 
        await apiClient.get(`/stats/${streamerId}`);
      
      if (!response.data.success) {
        throw new Error('獲取直播統計失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '獲取直播統計失敗');
    }
  }

  /**
   * 開始直播
   */
  async startStream(streamerId: string): Promise<{ message: string; streamInfo: StreamInfo }> {
    try {
      // 這裡應該調用實際的開始直播 API
      // 目前返回模擬資料
      const streamInfo: StreamInfo = {
        streamerId,
        title: `${streamerId} 的直播`,
        description: '直播進行中',
        isLive: true,
        viewerCount: 0,
        startTime: new Date().toISOString(),
        category: 'Just Chatting',
        tags: ['直播', '聊天'],
        overlaySettings: {
          showDonations: true,
          showViewerCount: true,
          showLatestFollower: true,
          theme: 'dark'
        }
      };

      return {
        message: '直播開始成功',
        streamInfo
      };
    } catch (error: any) {
      throw new Error(error.message || '開始直播失敗');
    }
  }

  /**
   * 停止直播
   */
  async stopStream(streamerId: string): Promise<{ message: string; streamInfo: StreamInfo }> {
    try {
      // 這裡應該調用實際的停止直播 API
      // 目前返回模擬資料
      const streamInfo: StreamInfo = {
        streamerId,
        title: `${streamerId} 的直播`,
        description: '直播已結束',
        isLive: false,
        viewerCount: 0,
        startTime: new Date().toISOString(),
        category: 'Just Chatting',
        tags: ['直播', '聊天'],
        overlaySettings: {
          showDonations: true,
          showViewerCount: true,
          showLatestFollower: true,
          theme: 'dark'
        }
      };

      return {
        message: '直播停止成功',
        streamInfo
      };
    } catch (error: any) {
      throw new Error(error.message || '停止直播失敗');
    }
  }

  /**
   * 獲取直播歷史記錄
   */
  async getStreamHistory(streamerId: string, params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    streams: Array<{
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      duration: number;
      peakViewers: number;
      totalDonations: number;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);

      const response: AxiosResponse<{ success: boolean; data: any }> = 
        await apiClient.get(`/streams/${streamerId}/history?${queryParams.toString()}`);
      
      if (!response.data.success) {
        throw new Error('獲取直播歷史失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '獲取直播歷史失敗');
    }
  }

  /**
   * 獲取直播分析資料
   */
  async getStreamAnalytics(streamerId: string, timeRange: '24h' | '7d' | '30d' | '90d'): Promise<{
    viewerTrends: Array<{ timestamp: string; viewers: number }>;
    donationTrends: Array<{ timestamp: string; amount: number; count: number }>;
    engagementMetrics: {
      averageViewTime: number;
      chatActivity: number;
      peakConcurrentViewers: number;
      totalUniqueViewers: number;
    };
    topDonations: Array<{
      donorName: string;
      amount: number;
      timestamp: string;
      message: string;
    }>;
  }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any }> = 
        await apiClient.get(`/streams/${streamerId}/analytics?timeRange=${timeRange}`);
      
      if (!response.data.success) {
        throw new Error('獲取直播分析失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '獲取直播分析失敗');
    }
  }

  /**
   * 更新直播狀態
   */
  async updateStreamStatus(streamerId: string, status: {
    isLive?: boolean;
    viewerCount?: number;
    quality?: string;
    bitrate?: number;
  }): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: { message: string } }> = 
        await apiClient.patch(`/streams/${streamerId}/status`, status);
      
      if (!response.data.success) {
        throw new Error('更新直播狀態失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '更新直播狀態失敗');
    }
  }

  /**
   * 獲取推薦的直播設定
   */
  async getRecommendedSettings(streamerId: string): Promise<{
    quality: string;
    bitrate: number;
    fps: number;
    resolution: string;
    encoder: string;
  }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any }> = 
        await apiClient.get(`/streams/${streamerId}/recommended-settings`);
      
      if (!response.data.success) {
        throw new Error('獲取推薦設定失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '獲取推薦設定失敗');
    }
  }

  /**
   * 測試直播連接
   */
  async testStreamConnection(streamerId: string): Promise<{
    status: 'success' | 'failed';
    latency: number;
    quality: string;
    message: string;
  }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any }> = 
        await apiClient.post(`/streams/${streamerId}/test-connection`);
      
      if (!response.data.success) {
        throw new Error('測試連接失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '測試連接失敗');
    }
  }
}

// 導出單例實例
export const streamService = new StreamService();
export default streamService;
