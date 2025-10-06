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
export interface Donation {
  id: string;
  streamerId: string;
  donorName: string;
  amount: number;
  currency: string;
  message: string;
  timestamp: string;
  isAnonymous: boolean;
  platform: 'youtube' | 'twitch' | 'api';
}

export interface DonationGoal {
  id: string;
  streamerId: string;
  title: string;
  target: number;
  current: number;
  currency: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface DonationStats {
  totalAmount: number;
  totalCount: number;
  todayAmount: number;
  todayCount: number;
  monthlyAmount: number;
  monthlyCount: number;
  currency: string;
  topDonation: Donation | null;
  recentDonations: Donation[];
}

export interface CreateDonationData {
  streamerId: string;
  donorName: string;
  amount: number;
  currency: string;
  message?: string;
  isAnonymous?: boolean;
}

export interface CreateGoalData {
  streamerId: string;
  title: string;
  target: number;
  currency: string;
  endDate?: string;
}

// 斗內服務類
class DonationService {
  /**
   * 獲取斗內記錄
   */
  async getDonations(params: {
    streamerId: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    donations: Donation[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    summary: {
      totalAmount: number;
      totalCount: number;
      currency: string;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const response: AxiosResponse<{ success: boolean; data: any }> = 
        await apiClient.get(`/donations/${params.streamerId}?${queryParams.toString()}`);
      
      if (!response.data.success) {
        throw new Error('獲取斗內記錄失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '獲取斗內記錄失敗');
    }
  }

  /**
   * 創建新的斗內記錄
   */
  async createDonation(donationData: CreateDonationData): Promise<Donation> {
    try {
      const response: AxiosResponse<{ success: boolean; data: Donation }> = 
        await apiClient.post(`/donations/${donationData.streamerId}`, donationData);
      
      if (!response.data.success) {
        throw new Error('創建斗內記錄失敗');
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
      throw new Error(error.message || '創建斗內記錄失敗');
    }
  }

  /**
   * 獲取斗內統計資料
   */
  async getDonationStats(streamerId: string): Promise<DonationStats> {
    try {
      const response: AxiosResponse<{ success: boolean; data: DonationStats }> = 
        await apiClient.get(`/donations/${streamerId}/stats`);
      
      if (!response.data.success) {
        throw new Error('獲取斗內統計失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '獲取斗內統計失敗');
    }
  }

  /**
   * 獲取斗內目標列表
   */
  async getDonationGoals(streamerId: string): Promise<DonationGoal[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: DonationGoal[] }> = 
        await apiClient.get(`/donations/${streamerId}/goals`);
      
      if (!response.data.success) {
        throw new Error('獲取斗內目標失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '獲取斗內目標失敗');
    }
  }

  /**
   * 創建斗內目標
   */
  async createDonationGoal(goalData: CreateGoalData): Promise<DonationGoal> {
    try {
      const response: AxiosResponse<{ success: boolean; data: DonationGoal }> = 
        await apiClient.post(`/donations/${goalData.streamerId}/goals`, goalData);
      
      if (!response.data.success) {
        throw new Error('創建斗內目標失敗');
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
      throw new Error(error.message || '創建斗內目標失敗');
    }
  }

  /**
   * 更新斗內目標
   */
  async updateDonationGoal(goalId: string, updates: Partial<DonationGoal>): Promise<DonationGoal> {
    try {
      const response: AxiosResponse<{ success: boolean; data: DonationGoal }> = 
        await apiClient.put(`/donations/goals/${goalId}`, updates);
      
      if (!response.data.success) {
        throw new Error('更新斗內目標失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '更新斗內目標失敗');
    }
  }

  /**
   * 刪除斗內目標
   */
  async deleteDonationGoal(goalId: string): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: { message: string } }> = 
        await apiClient.delete(`/donations/goals/${goalId}`);
      
      if (!response.data.success) {
        throw new Error('刪除斗內目標失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '刪除斗內目標失敗');
    }
  }

  /**
   * 獲取斗內排行榜
   */
  async getDonationLeaderboard(streamerId: string, timeRange: 'today' | 'week' | 'month' | 'all'): Promise<{
    topDonors: Array<{
      donorName: string;
      totalAmount: number;
      donationCount: number;
      lastDonation: string;
      isAnonymous: boolean;
    }>;
    timeRange: string;
    currency: string;
  }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any }> = 
        await apiClient.get(`/donations/${streamerId}/leaderboard?timeRange=${timeRange}`);
      
      if (!response.data.success) {
        throw new Error('獲取斗內排行榜失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '獲取斗內排行榜失敗');
    }
  }

  /**
   * 獲取斗內趨勢分析
   */
  async getDonationTrends(streamerId: string, timeRange: '24h' | '7d' | '30d'): Promise<{
    trends: Array<{
      timestamp: string;
      amount: number;
      count: number;
    }>;
    summary: {
      totalAmount: number;
      totalCount: number;
      averageAmount: number;
      peakHour: string;
      growthRate: number;
    };
  }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any }> = 
        await apiClient.get(`/donations/${streamerId}/trends?timeRange=${timeRange}`);
      
      if (!response.data.success) {
        throw new Error('獲取斗內趨勢失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '獲取斗內趨勢失敗');
    }
  }

  /**
   * 導出斗內記錄
   */
  async exportDonations(streamerId: string, params: {
    format: 'csv' | 'excel' | 'json';
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', params.format);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const response = await apiClient.get(
        `/donations/${streamerId}/export?${queryParams.toString()}`,
        { responseType: 'blob' }
      );
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || '導出斗內記錄失敗');
    }
  }

  /**
   * 測試斗內通知
   */
  async testDonationAlert(streamerId: string, testData: {
    donorName: string;
    amount: number;
    message: string;
  }): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: { message: string } }> = 
        await apiClient.post(`/donations/${streamerId}/test-alert`, testData);
      
      if (!response.data.success) {
        throw new Error('測試斗內通知失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '測試斗內通知失敗');
    }
  }

  /**
   * 獲取斗內設定
   */
  async getDonationSettings(streamerId: string): Promise<{
    minAmount: number;
    currency: string;
    allowAnonymous: boolean;
    moderateMessages: boolean;
    alertSettings: {
      enabled: boolean;
      minAmountForAlert: number;
      soundEnabled: boolean;
      displayDuration: number;
    };
  }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any }> = 
        await apiClient.get(`/donations/${streamerId}/settings`);
      
      if (!response.data.success) {
        throw new Error('獲取斗內設定失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '獲取斗內設定失敗');
    }
  }

  /**
   * 更新斗內設定
   */
  async updateDonationSettings(streamerId: string, settings: {
    minAmount?: number;
    currency?: string;
    allowAnonymous?: boolean;
    moderateMessages?: boolean;
    alertSettings?: {
      enabled?: boolean;
      minAmountForAlert?: number;
      soundEnabled?: boolean;
      displayDuration?: number;
    };
  }): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: { message: string } }> = 
        await apiClient.put(`/donations/${streamerId}/settings`, settings);
      
      if (!response.data.success) {
        throw new Error('更新斗內設定失敗');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error(error.message || '更新斗內設定失敗');
    }
  }
}

// 導出單例實例
export const donationService = new DonationService();
export default donationService;
