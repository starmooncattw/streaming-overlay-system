# 03-YouTube Single Stream Integration - YouTube 單直播整合

> 🤖 **AI 使用指南**：此模組實現 YouTube 聊天室爬蟲和顯示功能，是系統的核心價值模組。AI 應特別注意反爬蟲機制和 API 配額管理。

## 🔄 前置需求檢查

### 📋 **必要條件**
- [ ] **依賴文檔**: 01-基礎系統架構、02-即時通訊系統 (必須先完成)
- [ ] **必要工具**: Google Cloud Console 帳號、YouTube 頻道 (測試用)
- [ ] **技能需求**: 🟡 中等 - API 整合、網頁爬蟲、OAuth 流程
- [ ] **預估時間**: ⏱️ 2-3 週 (每日 2-4 小時)

### 🎯 **完成後可獲得**
- ✅ YouTube OAuth 認證系統
- ✅ 直播搜尋和連接功能
- ✅ 穩定的聊天室爬蟲系統
- ✅ 即時聊天訊息顯示
- ✅ 完整的錯誤處理和恢復機制

## 🎯 本階段目標

### 🏗️ **主要任務**
實現 YouTube 直播聊天室的完整整合，包含認證、搜尋、爬蟲和顯示功能。

### 📊 **完成標準**
- YouTube OAuth 授權流程完整運作
- 可搜尋並連接到進行中的直播
- 聊天訊息即時擷取和顯示 (延遲 < 5 秒)
- 爬蟲穩定運行 > 4 小時無中斷
- API 配額使用率 < 80%

## 🔧 詳細執行步驟

### 🚨 第一步：YouTube API 設定
**位置**: Google Cloud Console
**目標**: 建立 YouTube Data API 專案和憑證
**🎯 用戶情境**: 🟢 BEGINNER | 🟡 INTERMEDIATE

#### 💻 1.1 建立 Google Cloud 專案
```bash
# 📋 CHECKLIST - Google Cloud Console 設定
# 1. 前往 https://console.cloud.google.com/
# 2. 建立新專案或選擇現有專案
# 3. 專案名稱：streaming-overlay-youtube
# 4. 記錄專案 ID 供後續使用
```

#### 💻 1.2 啟用 YouTube Data API v3
```bash
# 📋 CHECKLIST - 啟用 API 服務
# 1. 在 Google Cloud Console 中
# 2. 導航到「API 和服務」→「程式庫」
# 3. 搜尋「YouTube Data API v3」
# 4. 點擊「啟用」
# 5. 等待啟用完成
```

#### 💻 1.3 建立 OAuth 2.0 憑證
```bash
# 📋 CHECKLIST - 設定 OAuth 憑證
# 1. 導航到「API 和服務」→「憑證」
# 2. 點擊「建立憑證」→「OAuth 2.0 用戶端 ID」
# 3. 應用程式類型：網頁應用程式
# 4. 名稱：Streaming Overlay YouTube Integration
# 5. 授權的 JavaScript 來源：http://localhost:5173
# 6. 授權的重新導向 URI：http://localhost:5173/youtube/callback
# 7. 下載 JSON 憑證檔案
```

**🔍 驗證方法**：
- 確認 YouTube Data API v3 已啟用
- OAuth 憑證已建立並下載 JSON 檔案
- 記錄 Client ID 和 Client Secret

### 🚨 第二步：YouTube 認證服務
**位置**: frontend/src/ 目錄
**目標**: 實現 YouTube OAuth 認證流程
**🎯 用戶情境**: 🟡 INTERMEDIATE | 🔴 ADVANCED

#### 💻 2.1 安裝 Google API 套件
```bash
# 📋 CHECKLIST - 安裝必要套件
cd frontend
npm install googleapis google-auth-library
```

#### 💻 2.2 建立 YouTube 認證服務
```typescript
// 📋 CHECKLIST - 建立 src/services/youtubeAuthService.ts
import { GoogleAuth } from 'google-auth-library';

interface YouTubeCredentials {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

class YouTubeAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private scopes: string[];

  constructor() {
    this.clientId = process.env.REACT_APP_YOUTUBE_CLIENT_ID || '';
    this.clientSecret = process.env.REACT_APP_YOUTUBE_CLIENT_SECRET || '';
    this.redirectUri = process.env.REACT_APP_YOUTUBE_REDIRECT_URI || 'http://localhost:5173/youtube/callback';
    this.scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ];
  }

  // 生成授權 URL
  generateAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // 交換授權碼為存取令牌
  async exchangeCodeForTokens(code: string): Promise<YouTubeCredentials> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`OAuth token exchange failed: ${response.statusText}`);
      }

      const tokens = await response.json();
      
      // 儲存到 localStorage
      localStorage.setItem('youtube_credentials', JSON.stringify(tokens));
      
      return tokens;
    } catch (error) {
      console.error('YouTube OAuth 失敗:', error);
      throw error;
    }
  }

  // 獲取儲存的憑證
  getStoredCredentials(): YouTubeCredentials | null {
    try {
      const stored = localStorage.getItem('youtube_credentials');
      if (!stored) return null;
      
      const credentials = JSON.parse(stored);
      
      // 檢查是否過期
      if (credentials.expiry_date && Date.now() >= credentials.expiry_date) {
        return null;
      }
      
      return credentials;
    } catch (error) {
      console.error('獲取 YouTube 憑證失敗:', error);
      return null;
    }
  }

  // 刷新存取令牌
  async refreshAccessToken(): Promise<YouTubeCredentials | null> {
    try {
      const credentials = this.getStoredCredentials();
      if (!credentials?.refresh_token) {
        throw new Error('沒有 refresh token');
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: credentials.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const newTokens = await response.json();
      
      // 合併新舊憑證
      const updatedCredentials = {
        ...credentials,
        ...newTokens,
        expiry_date: Date.now() + (newTokens.expires_in * 1000)
      };
      
      localStorage.setItem('youtube_credentials', JSON.stringify(updatedCredentials));
      
      return updatedCredentials;
    } catch (error) {
      console.error('刷新 YouTube token 失敗:', error);
      this.clearCredentials();
      return null;
    }
  }

  // 清除憑證
  clearCredentials(): void {
    localStorage.removeItem('youtube_credentials');
  }

  // 檢查是否已認證
  isAuthenticated(): boolean {
    const credentials = this.getStoredCredentials();
    return credentials !== null;
  }
}

export const youtubeAuthService = new YouTubeAuthService();
```

### 🚨 第三步：YouTube API 服務
**位置**: backend/src/ 目錄
**目標**: 建立 YouTube Data API 整合
**🎯 用戶情境**: 🟡 INTERMEDIATE | 🔴 ADVANCED

#### 💻 3.1 建立 YouTube API 服務
```typescript
// 📋 CHECKLIST - 建立 src/services/youtubeApiService.ts
import { google, youtube_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

interface LiveStream {
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

class YouTubeApiService {
  private youtube: youtube_v3.Youtube;
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    this.youtube = google.youtube({
      version: 'v3',
      auth: this.oauth2Client
    });
  }

  // 設定使用者憑證
  setCredentials(credentials: any): void {
    this.oauth2Client.setCredentials(credentials);
  }

  // 搜尋進行中的直播
  async searchLiveStreams(query: string, maxResults: number = 10): Promise<LiveStream[]> {
    try {
      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        type: ['video'],
        eventType: 'live',
        maxResults: maxResults,
        order: 'viewCount'
      });

      if (!response.data.items) {
        return [];
      }

      const streams: LiveStream[] = [];

      for (const item of response.data.items) {
        if (!item.id?.videoId) continue;

        // 獲取詳細資訊
        const videoDetails = await this.getVideoDetails(item.id.videoId);
        if (videoDetails) {
          streams.push(videoDetails);
        }
      }

      return streams;
    } catch (error) {
      console.error('搜尋直播失敗:', error);
      throw error;
    }
  }

  // 獲取影片詳細資訊
  async getVideoDetails(videoId: string): Promise<LiveStream | null> {
    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'liveStreamingDetails', 'statistics'],
        id: [videoId]
      });

      const video = response.data.items?.[0];
      if (!video || !video.liveStreamingDetails?.activeLiveChatId) {
        return null;
      }

      return {
        id: videoId,
        title: video.snippet?.title || '',
        description: video.snippet?.description || '',
        channelId: video.snippet?.channelId || '',
        channelTitle: video.snippet?.channelTitle || '',
        thumbnailUrl: video.snippet?.thumbnails?.medium?.url || '',
        viewerCount: parseInt(video.liveStreamingDetails.concurrentViewers || '0'),
        startTime: video.liveStreamingDetails.actualStartTime || '',
        chatId: video.liveStreamingDetails.activeLiveChatId
      };
    } catch (error) {
      console.error('獲取影片詳情失敗:', error);
      return null;
    }
  }

  // 獲取聊天室訊息
  async getChatMessages(chatId: string, pageToken?: string): Promise<any> {
    try {
      const response = await this.youtube.liveChatMessages.list({
        liveChatId: chatId,
        part: ['snippet', 'authorDetails'],
        maxResults: 200,
        pageToken: pageToken
      });

      return {
        messages: response.data.items || [],
        nextPageToken: response.data.nextPageToken,
        pollingIntervalMillis: response.data.pollingIntervalMillis || 5000
      };
    } catch (error) {
      console.error('獲取聊天訊息失敗:', error);
      throw error;
    }
  }

  // 獲取頻道資訊
  async getChannelInfo(channelId: string): Promise<any> {
    try {
      const response = await this.youtube.channels.list({
        part: ['snippet', 'statistics'],
        id: [channelId]
      });

      return response.data.items?.[0] || null;
    } catch (error) {
      console.error('獲取頻道資訊失敗:', error);
      return null;
    }
  }
}

export const youtubeApiService = new YouTubeApiService();
```

### 🚨 第四步：聊天室爬蟲系統
**位置**: backend/src/ 目錄
**目標**: 建立穩定的聊天室訊息爬蟲
**🎯 用戶情境**: 🔴 ADVANCED

#### 💻 4.1 建立爬蟲管理器
```typescript
// 📋 CHECKLIST - 建立 src/services/youtubeCrawlerService.ts
import { youtubeApiService } from './youtubeApiService';
import { messageService } from './messageService';
import { ChatMessage } from '../types/message';
import { v4 as uuidv4 } from 'uuid';

interface CrawlerSession {
  streamerId: string;
  videoId: string;
  chatId: string;
  isActive: boolean;
  nextPageToken?: string;
  pollingInterval: number;
  lastMessageTime: Date;
  errorCount: number;
  startTime: Date;
}

class YouTubeCrawlerService {
  private sessions: Map<string, CrawlerSession> = new Map();
  private readonly MAX_ERROR_COUNT = 5;
  private readonly DEFAULT_POLLING_INTERVAL = 5000;
  private readonly MAX_SESSIONS = 5;

  // 開始爬蟲會話
  async startCrawling(streamerId: string, videoId: string, credentials: any): Promise<boolean> {
    try {
      // 檢查會話數量限制
      if (this.sessions.size >= this.MAX_SESSIONS) {
        throw new Error('達到最大會話數量限制');
      }

      // 設定 API 憑證
      youtubeApiService.setCredentials(credentials);

      // 獲取影片詳情
      const videoDetails = await youtubeApiService.getVideoDetails(videoId);
      if (!videoDetails) {
        throw new Error('無法獲取影片詳情');
      }

      // 建立爬蟲會話
      const session: CrawlerSession = {
        streamerId,
        videoId,
        chatId: videoDetails.chatId,
        isActive: true,
        pollingInterval: this.DEFAULT_POLLING_INTERVAL,
        lastMessageTime: new Date(),
        errorCount: 0,
        startTime: new Date()
      };

      this.sessions.set(streamerId, session);

      // 開始爬蟲循環
      this.startCrawlingLoop(session);

      console.log(`開始爬蟲會話: ${streamerId} (${videoId})`);
      return true;
    } catch (error) {
      console.error('啟動爬蟲失敗:', error);
      return false;
    }
  }

  // 停止爬蟲會話
  stopCrawling(streamerId: string): void {
    const session = this.sessions.get(streamerId);
    if (session) {
      session.isActive = false;
      this.sessions.delete(streamerId);
      console.log(`停止爬蟲會話: ${streamerId}`);
    }
  }

  // 爬蟲循環
  private async startCrawlingLoop(session: CrawlerSession): Promise<void> {
    while (session.isActive) {
      try {
        await this.crawlMessages(session);
        session.errorCount = 0; // 重置錯誤計數
        
        // 等待下次輪詢
        await this.sleep(session.pollingInterval);
      } catch (error) {
        console.error(`爬蟲錯誤 (${session.streamerId}):`, error);
        session.errorCount++;

        if (session.errorCount >= this.MAX_ERROR_COUNT) {
          console.error(`會話 ${session.streamerId} 錯誤次數過多，停止爬蟲`);
          this.stopCrawling(session.streamerId);
          break;
        }

        // 錯誤後等待較長時間
        await this.sleep(session.pollingInterval * 2);
      }
    }
  }

  // 爬取訊息
  private async crawlMessages(session: CrawlerSession): Promise<void> {
    const result = await youtubeApiService.getChatMessages(
      session.chatId,
      session.nextPageToken
    );

    // 更新輪詢間隔
    session.pollingInterval = result.pollingIntervalMillis || this.DEFAULT_POLLING_INTERVAL;
    session.nextPageToken = result.nextPageToken;

    // 處理訊息
    for (const item of result.messages) {
      const message = this.parseYouTubeMessage(item, session.streamerId);
      if (message) {
        messageService.addMessage(session.streamerId, message);
        
        // 透過 WebSocket 廣播
        // 這裡需要引用 SocketHandler 實例
        // socketHandler.broadcastMessage(session.streamerId, message);
      }
    }

    session.lastMessageTime = new Date();
  }

  // 解析 YouTube 訊息
  private parseYouTubeMessage(item: any, streamerId: string): ChatMessage | null {
    try {
      const snippet = item.snippet;
      const author = item.authorDetails;

      if (!snippet || !author) return null;

      return {
        id: uuidv4(),
        streamerId,
        username: author.displayName || 'Unknown',
        message: snippet.displayMessage || '',
        timestamp: new Date(snippet.publishedAt),
        platform: 'youtube',
        metadata: {
          userId: author.channelId,
          badges: author.isChatModerator ? ['moderator'] : [],
          color: '#1976d2' // YouTube 預設顏色
        }
      };
    } catch (error) {
      console.error('解析 YouTube 訊息失敗:', error);
      return null;
    }
  }

  // 獲取會話統計
  getSessionStats(streamerId: string): any {
    const session = this.sessions.get(streamerId);
    if (!session) return null;

    return {
      isActive: session.isActive,
      videoId: session.videoId,
      pollingInterval: session.pollingInterval,
      errorCount: session.errorCount,
      uptime: Date.now() - session.startTime.getTime(),
      lastMessageTime: session.lastMessageTime
    };
  }

  // 獲取所有會話統計
  getAllSessions(): any[] {
    return Array.from(this.sessions.entries()).map(([streamerId, session]) => ({
      streamerId,
      ...this.getSessionStats(streamerId)
    }));
  }

  // 工具函數：延遲
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const youtubeCrawlerService = new YouTubeCrawlerService();
```

## ✅ 完成驗證

### 🧪 **功能測試**
```markdown
測試清單：
- [ ] YouTube OAuth 認證流程完整
- [ ] 可搜尋進行中的直播
- [ ] 可成功連接到直播聊天室
- [ ] 聊天訊息即時顯示
- [ ] 爬蟲穩定運行 > 1 小時
- [ ] 錯誤恢復機制正常運作
```

### 🔍 **API 配額監控**
- [ ] 每日 API 使用量 < 8000 units
- [ ] 搜尋 API 調用頻率合理
- [ ] 聊天 API 輪詢間隔適當

### ⚠️ **常見問題處理**
- **YouTube 反爬蟲**: 使用官方 API，遵循輪詢間隔
- **API 配額超限**: 監控使用量，實施快取策略
- **認證過期**: 自動刷新 token 機制

---

**🎉 恭喜！** YouTube 單直播整合完成，現在可以進行多直播整合開發！
