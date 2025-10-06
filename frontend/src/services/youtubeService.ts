import axios from 'axios';

// 使用相對路徑,讓 proxy 處理轉發
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  withCredentials: true,
  timeout: 10000,
});

// 請求攔截器
api.interceptors.request.use(
  (config) => {
    console.log('📤 API 請求:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ 請求錯誤:', error);
    return Promise.reject(error);
  }
);

// 響應攔截器
api.interceptors.response.use(
  (response) => {
    console.log('✅ API 響應:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ 響應錯誤:', error.config?.url, error.message);
    return Promise.reject(error);
  }
);

export interface YouTubeCredentials {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface LiveStream {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
  viewerCount: number;
  startTime: string;
  chatId: string;
}

class YouTubeService {
  private credentials: YouTubeCredentials | null = null;

  /**
   * 獲取 OAuth 授權 URL
   */
  async getAuthUrl(): Promise<string> {
    try {
      const response = await api.get('/api/youtube/auth/url');
      return response.data.authUrl;
    } catch (error) {
      console.error('獲取授權 URL 失敗:', error);
      throw error;
    }
  }

  /**
   * 使用授權碼交換令牌
   */
  async exchangeCode(code: string): Promise<YouTubeCredentials> {
    try {
      const response = await api.get('/api/youtube/auth/callback', {
        params: { code }
      });

      this.credentials = response.data.credentials;
      if (this.credentials) {
        this.saveCredentials(this.credentials);
        return this.credentials;
      }
      throw new Error('未獲取到憑證');
    } catch (error) {
      console.error('交換令牌失敗:', error);
      throw error;
    }
  }

  /**
   * 刷新存取令牌
   */
  async refreshToken(): Promise<YouTubeCredentials> {
    try {
      const credentials = this.getCredentials();
      if (!credentials?.refresh_token) {
        throw new Error('沒有 refresh token');
      }

      const response = await api.post('/api/youtube/auth/refresh', {
        refresh_token: credentials.refresh_token
      });

      this.credentials = response.data.credentials;
      if (this.credentials) {
        this.saveCredentials(this.credentials);
        return this.credentials;
      }
      throw new Error('未獲取到憑證');
    } catch (error) {
      console.error('刷新令牌失敗:', error);
      this.clearCredentials();
      throw error;
    }
  }

  /**
   * 搜尋進行中的直播
   */
  async searchLiveStreams(query: string, maxResults: number = 10): Promise<LiveStream[]> {
    try {
      const credentials = this.getCredentials();
      if (!credentials) {
        throw new Error('未認證');
      }

      const response = await api.post('/api/youtube/search', {
        query,
        credentials,
        maxResults
      });

      return response.data.streams;
    } catch (error) {
      console.error('搜尋直播失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取影片詳情
   */
  async getVideoDetails(videoId: string): Promise<LiveStream> {
    try {
      const credentials = this.getCredentials();
      if (!credentials) {
        throw new Error('未認證');
      }

      const response = await api.post(`/api/youtube/video/${videoId}`, {
        credentials
      });

      return response.data.video;
    } catch (error) {
      console.error('獲取影片詳情失敗:', error);
      throw error;
    }
  }

  /**
   * 開始爬蟲
   */
  async startCrawler(streamerId: string, videoId: string): Promise<void> {
    try {
      const credentials = this.getCredentials();
      if (!credentials) {
        throw new Error('未認證');
      }

      await api.post('/api/youtube/crawler/start', {
        streamerId,
        videoId,
        credentials
      });
    } catch (error) {
      console.error('啟動爬蟲失敗:', error);
      throw error;
    }
  }

  /**
   * 停止爬蟲
   */
  async stopCrawler(streamerId: string): Promise<void> {
    try {
      await api.post('/api/youtube/crawler/stop', {
        streamerId
      });
    } catch (error) {
      console.error('停止爬蟲失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取爬蟲狀態
   */
  async getCrawlerStatus(streamerId: string): Promise<any> {
    try {
      const response = await api.get(`/api/youtube/crawler/status/${streamerId}`);
      return response.data.stats;
    } catch (error) {
      console.error('獲取爬蟲狀態失敗:', error);
      return null;
    }
  }

  /**
   * 儲存憑證到 localStorage
   */
  private saveCredentials(credentials: YouTubeCredentials): void {
    localStorage.setItem('youtube_credentials', JSON.stringify(credentials));
  }

  /**
   * 從 localStorage 獲取憑證
   */
  getCredentials(): YouTubeCredentials | null {
    if (this.credentials) return this.credentials;

    try {
      const stored = localStorage.getItem('youtube_credentials');
      if (!stored) return null;

      const credentials = JSON.parse(stored);

      // 檢查是否過期
      if (credentials.expiry_date && Date.now() >= credentials.expiry_date) {
        this.clearCredentials();
        return null;
      }

      this.credentials = credentials;
      return credentials;
    } catch (error) {
      console.error('獲取憑證失敗:', error);
      return null;
    }
  }

  /**
   * 清除憑證
   */
  clearCredentials(): void {
    this.credentials = null;
    localStorage.removeItem('youtube_credentials');
  }

  /**
   * 檢查是否已認證
   */
  isAuthenticated(): boolean {
    return this.getCredentials() !== null;
  }
}

export const youtubeService = new YouTubeService();
