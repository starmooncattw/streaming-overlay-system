# 05-Twitch Integration System - Twitch 整合系統

> 🤖 **AI 使用指南**：此模組實現 Twitch 平台整合，與 YouTube 系統並行運作。AI 需注意 Twitch IRC 協議和多平台訊息統一處理。

## 🔄 前置需求檢查

### 📋 **必要條件**
- [ ] **依賴文檔**: 03-YouTube 單直播整合 (必須先完成)
- [ ] **可選依賴**: 04-YouTube 多直播整合 (建議完成)
- [ ] **必要工具**: Twitch 開發者帳號、測試用 Twitch 頻道
- [ ] **技能需求**: 🟡 中等 - IRC 協議、WebSocket、多平台整合
- [ ] **預估時間**: ⏱️ 2-3 週 (每日 2-4 小時)

### 🎯 **完成後可獲得**
- ✅ Twitch OAuth 認證系統
- ✅ Twitch IRC 聊天室連接
- ✅ 多平台訊息統一顯示
- ✅ 跨平台重複訊息檢測
- ✅ 完整的雙平台支援

## 🎯 本階段目標

### 🏗️ **主要任務**
整合 Twitch 平台，實現 YouTube + Twitch 雙平台聊天室統一管理。

### 📊 **完成標準**
- Twitch OAuth 認證流程完整
- IRC 連接穩定，支援自動重連
- YouTube + Twitch 訊息統一顯示
- 跨平台訊息去重和標識
- 雙平台併發穩定運行 > 4 小時

## 🔧 詳細執行步驟

### 🚨 第一步：Twitch API 設定
**位置**: Twitch 開發者控制台
**目標**: 建立 Twitch 應用程式和 OAuth 設定
**🎯 用戶情境**: 🟢 BEGINNER | 🟡 INTERMEDIATE

#### 💻 1.1 建立 Twitch 應用程式
```bash
# 📋 CHECKLIST - Twitch 開發者控制台設定
# 1. 前往 https://dev.twitch.tv/console
# 2. 登入 Twitch 帳號
# 3. 點擊「Register Your Application」
# 4. 填寫應用程式資訊：
#    - Name: Streaming Overlay Twitch Integration
#    - OAuth Redirect URLs: http://localhost:5173/twitch/callback
#    - Category: Chat Bot
# 5. 記錄 Client ID 和 Client Secret
```

#### 💻 1.2 獲取必要權限範圍
```typescript
// 📋 CHECKLIST - Twitch OAuth 權限範圍
const TWITCH_SCOPES = [
  'chat:read',           // 讀取聊天訊息
  'chat:edit',           // 發送聊天訊息 (可選)
  'user:read:email',     // 讀取用戶 email
  'channel:read:subscriptions' // 讀取訂閱資訊 (可選)
];
```

### 🚨 第二步：Twitch 認證服務
**位置**: frontend/src/ 目錄
**目標**: 實現 Twitch OAuth 認證流程
**🎯 用戶情境**: 🟡 INTERMEDIATE

#### 💻 2.1 建立 Twitch 認證服務
```typescript
// 📋 CHECKLIST - 建立 src/services/twitchAuthService.ts
interface TwitchCredentials {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string[];
  token_type: string;
  expiry_date: number;
}

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  email: string;
  profile_image_url: string;
}

class TwitchAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private scopes: string[];

  constructor() {
    this.clientId = process.env.REACT_APP_TWITCH_CLIENT_ID || '';
    this.clientSecret = process.env.REACT_APP_TWITCH_CLIENT_SECRET || '';
    this.redirectUri = process.env.REACT_APP_TWITCH_REDIRECT_URI || 'http://localhost:5173/twitch/callback';
    this.scopes = [
      'chat:read',
      'user:read:email'
    ];
  }

  // 生成授權 URL
  generateAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      force_verify: 'true'
    });

    return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  }

  // 交換授權碼為存取令牌
  async exchangeCodeForTokens(code: string): Promise<TwitchCredentials> {
    try {
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
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
        throw new Error(`Twitch OAuth 失敗: ${response.statusText}`);
      }

      const tokens = await response.json();
      
      // 添加過期時間
      tokens.expiry_date = Date.now() + (tokens.expires_in * 1000);
      
      // 儲存到 localStorage
      localStorage.setItem('twitch_credentials', JSON.stringify(tokens));
      
      return tokens;
    } catch (error) {
      console.error('Twitch OAuth 失敗:', error);
      throw error;
    }
  }

  // 獲取用戶資訊
  async getUserInfo(): Promise<TwitchUser | null> {
    try {
      const credentials = this.getStoredCredentials();
      if (!credentials) return null;

      const response = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Client-Id': this.clientId
        }
      });

      if (!response.ok) {
        throw new Error(`獲取 Twitch 用戶資訊失敗: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0] || null;
    } catch (error) {
      console.error('獲取 Twitch 用戶資訊失敗:', error);
      return null;
    }
  }

  // 獲取儲存的憑證
  getStoredCredentials(): TwitchCredentials | null {
    try {
      const stored = localStorage.getItem('twitch_credentials');
      if (!stored) return null;
      
      const credentials = JSON.parse(stored);
      
      // 檢查是否過期
      if (credentials.expiry_date && Date.now() >= credentials.expiry_date) {
        return null;
      }
      
      return credentials;
    } catch (error) {
      console.error('獲取 Twitch 憑證失敗:', error);
      return null;
    }
  }

  // 刷新存取令牌
  async refreshAccessToken(): Promise<TwitchCredentials | null> {
    try {
      const credentials = this.getStoredCredentials();
      if (!credentials?.refresh_token) {
        throw new Error('沒有 refresh token');
      }

      const response = await fetch('https://id.twitch.tv/oauth2/token', {
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
        throw new Error(`Twitch token 刷新失敗: ${response.statusText}`);
      }

      const newTokens = await response.json();
      
      // 合併新舊憑證
      const updatedCredentials = {
        ...credentials,
        ...newTokens,
        expiry_date: Date.now() + (newTokens.expires_in * 1000)
      };
      
      localStorage.setItem('twitch_credentials', JSON.stringify(updatedCredentials));
      
      return updatedCredentials;
    } catch (error) {
      console.error('刷新 Twitch token 失敗:', error);
      this.clearCredentials();
      return null;
    }
  }

  // 清除憑證
  clearCredentials(): void {
    localStorage.removeItem('twitch_credentials');
  }

  // 檢查是否已認證
  isAuthenticated(): boolean {
    const credentials = this.getStoredCredentials();
    return credentials !== null;
  }
}

export const twitchAuthService = new TwitchAuthService();
```

### 🚨 第三步：Twitch IRC 客戶端
**位置**: backend/src/ 目錄
**目標**: 建立 Twitch IRC 連接和訊息處理
**🎯 用戶情境**: 🔴 ADVANCED

#### 💻 3.1 安裝 Twitch IRC 套件
```bash
# 📋 CHECKLIST - 安裝 TMI.js
cd backend
npm install tmi.js
npm install @types/tmi.js --save-dev
```

#### 💻 3.2 建立 Twitch IRC 服務
```typescript
// 📋 CHECKLIST - 建立 src/services/twitchIrcService.ts
import tmi from 'tmi.js';
import { ChatMessage } from '../types/message';
import { messageService } from './messageService';
import { v4 as uuidv4 } from 'uuid';

interface TwitchSession {
  streamerId: string;
  channels: string[];
  client: tmi.Client | null;
  isConnected: boolean;
  messageCount: number;
  startTime: Date;
  lastMessageTime: Date;
}

class TwitchIrcService {
  private sessions: Map<string, TwitchSession> = new Map();
  private readonly MAX_CHANNELS_PER_SESSION = 10;

  // 建立 Twitch IRC 會話
  async createTwitchSession(streamerId: string, channels: string[], accessToken: string): Promise<boolean> {
    try {
      if (channels.length > this.MAX_CHANNELS_PER_SESSION) {
        throw new Error(`超過每個會話最大頻道數量: ${this.MAX_CHANNELS_PER_SESSION}`);
      }

      // 建立 TMI 客戶端
      const client = new tmi.Client({
        options: { debug: false },
        connection: {
          reconnect: true,
          secure: true
        },
        identity: {
          username: 'your_bot_username', // 可選，用於發送訊息
          password: `oauth:${accessToken}`
        },
        channels: channels
      });

      const session: TwitchSession = {
        streamerId,
        channels,
        client,
        isConnected: false,
        messageCount: 0,
        startTime: new Date(),
        lastMessageTime: new Date()
      };

      // 設定事件處理器
      this.setupEventHandlers(session);

      // 連接到 Twitch IRC
      await client.connect();

      this.sessions.set(streamerId, session);
      console.log(`建立 Twitch IRC 會話: ${streamerId}, 頻道: ${channels.join(', ')}`);
      
      return true;
    } catch (error) {
      console.error('建立 Twitch IRC 會話失敗:', error);
      return false;
    }
  }

  // 設定事件處理器
  private setupEventHandlers(session: TwitchSession): void {
    if (!session.client) return;

    // 連接成功
    session.client.on('connected', (address, port) => {
      console.log(`Twitch IRC 連接成功: ${address}:${port}`);
      session.isConnected = true;
    });

    // 斷線
    session.client.on('disconnected', (reason) => {
      console.log(`Twitch IRC 斷線: ${reason}`);
      session.isConnected = false;
    });

    // 接收訊息
    session.client.on('message', (channel, tags, message, self) => {
      if (self) return; // 忽略自己的訊息

      const chatMessage = this.parseTwitchMessage(
        session.streamerId,
        channel,
        tags,
        message
      );

      if (chatMessage) {
        messageService.addMessage(session.streamerId, chatMessage);
        session.messageCount++;
        session.lastMessageTime = new Date();

        // 透過 WebSocket 廣播 (需要引用 SocketHandler)
        // socketHandler.broadcastMessage(session.streamerId, chatMessage);
      }
    });

    // 錯誤處理
    session.client.on('error', (error) => {
      console.error('Twitch IRC 錯誤:', error);
    });

    // 重連
    session.client.on('reconnect', () => {
      console.log('Twitch IRC 重新連接中...');
    });
  }

  // 解析 Twitch 訊息
  private parseTwitchMessage(streamerId: string, channel: string, tags: any, message: string): ChatMessage | null {
    try {
      return {
        id: uuidv4(),
        streamerId,
        username: tags['display-name'] || tags.username || 'Unknown',
        message: message,
        timestamp: new Date(),
        platform: 'twitch',
        metadata: {
          userId: tags['user-id'],
          badges: this.parseTwitchBadges(tags.badges),
          emotes: tags.emotes,
          color: tags.color || '#9146FF', // Twitch 紫色
          sourceChannel: channel.replace('#', ''),
          isModerator: tags.mod === '1',
          isSubscriber: tags.subscriber === '1',
          isVip: tags.vip === '1'
        }
      };
    } catch (error) {
      console.error('解析 Twitch 訊息失敗:', error);
      return null;
    }
  }

  // 解析 Twitch 徽章
  private parseTwitchBadges(badges: any): string[] {
    if (!badges) return [];
    
    const badgeList: string[] = [];
    
    if (badges.broadcaster) badgeList.push('broadcaster');
    if (badges.moderator) badgeList.push('moderator');
    if (badges.vip) badgeList.push('vip');
    if (badges.subscriber) badgeList.push('subscriber');
    if (badges.premium) badgeList.push('premium');
    
    return badgeList;
  }

  // 停止 Twitch 會話
  stopTwitchSession(streamerId: string): void {
    const session = this.sessions.get(streamerId);
    if (session && session.client) {
      session.client.disconnect();
      this.sessions.delete(streamerId);
      console.log(`停止 Twitch IRC 會話: ${streamerId}`);
    }
  }

  // 獲取會話統計
  getTwitchSessionStats(streamerId: string): any {
    const session = this.sessions.get(streamerId);
    if (!session) return null;

    return {
      isConnected: session.isConnected,
      channels: session.channels,
      messageCount: session.messageCount,
      uptime: Date.now() - session.startTime.getTime(),
      lastMessageTime: session.lastMessageTime
    };
  }

  // 發送訊息到 Twitch (可選功能)
  async sendMessage(streamerId: string, channel: string, message: string): Promise<boolean> {
    try {
      const session = this.sessions.get(streamerId);
      if (!session || !session.client || !session.isConnected) {
        return false;
      }

      await session.client.say(channel, message);
      return true;
    } catch (error) {
      console.error('發送 Twitch 訊息失敗:', error);
      return false;
    }
  }
}

export const twitchIrcService = new TwitchIrcService();
```

### 🚨 第四步：多平台訊息整合
**位置**: backend/src/ 目錄
**目標**: 統一 YouTube 和 Twitch 訊息處理
**🎯 用戶情境**: 🔴 ADVANCED

#### 💻 4.1 建立多平台管理器
```typescript
// 📋 CHECKLIST - 建立 src/services/multiPlatformService.ts
interface PlatformSession {
  platform: 'youtube' | 'twitch';
  isActive: boolean;
  channels: string[];
  messageCount: number;
  startTime: Date;
}

interface MultiPlatformSession {
  streamerId: string;
  platforms: Map<string, PlatformSession>;
  totalMessages: number;
  isActive: boolean;
  createdAt: Date;
}

class MultiPlatformService {
  private sessions: Map<string, MultiPlatformSession> = new Map();

  // 建立多平台會話
  createMultiPlatformSession(streamerId: string): MultiPlatformSession {
    const session: MultiPlatformSession = {
      streamerId,
      platforms: new Map(),
      totalMessages: 0,
      isActive: true,
      createdAt: new Date()
    };

    this.sessions.set(streamerId, session);
    return session;
  }

  // 添加 YouTube 平台
  async addYouTubePlatform(streamerId: string, channels: string[], credentials: any): Promise<boolean> {
    try {
      const session = this.getOrCreateSession(streamerId);
      
      // 啟動 YouTube 爬蟲
      const success = await youtubeCrawlerService.startCrawling(streamerId, channels[0], credentials);
      
      if (success) {
        session.platforms.set('youtube', {
          platform: 'youtube',
          isActive: true,
          channels,
          messageCount: 0,
          startTime: new Date()
        });
      }
      
      return success;
    } catch (error) {
      console.error('添加 YouTube 平台失敗:', error);
      return false;
    }
  }

  // 添加 Twitch 平台
  async addTwitchPlatform(streamerId: string, channels: string[], accessToken: string): Promise<boolean> {
    try {
      const session = this.getOrCreateSession(streamerId);
      
      // 啟動 Twitch IRC
      const success = await twitchIrcService.createTwitchSession(streamerId, channels, accessToken);
      
      if (success) {
        session.platforms.set('twitch', {
          platform: 'twitch',
          isActive: true,
          channels,
          messageCount: 0,
          startTime: new Date()
        });
      }
      
      return success;
    } catch (error) {
      console.error('添加 Twitch 平台失敗:', error);
      return false;
    }
  }

  // 移除平台
  removePlatform(streamerId: string, platform: 'youtube' | 'twitch'): void {
    const session = this.sessions.get(streamerId);
    if (!session) return;

    if (platform === 'youtube') {
      youtubeCrawlerService.stopCrawling(streamerId);
    } else if (platform === 'twitch') {
      twitchIrcService.stopTwitchSession(streamerId);
    }

    session.platforms.delete(platform);
  }

  // 停止多平台會話
  stopMultiPlatformSession(streamerId: string): void {
    const session = this.sessions.get(streamerId);
    if (!session) return;

    // 停止所有平台
    for (const platform of session.platforms.keys()) {
      this.removePlatform(streamerId, platform as 'youtube' | 'twitch');
    }

    session.isActive = false;
    this.sessions.delete(streamerId);
  }

  // 獲取或建立會話
  private getOrCreateSession(streamerId: string): MultiPlatformSession {
    let session = this.sessions.get(streamerId);
    if (!session) {
      session = this.createMultiPlatformSession(streamerId);
    }
    return session;
  }

  // 獲取會話統計
  getSessionStats(streamerId: string): any {
    const session = this.sessions.get(streamerId);
    if (!session) return null;

    const platformStats: any = {};
    
    for (const [platform, platformSession] of session.platforms) {
      if (platform === 'youtube') {
        platformStats.youtube = youtubeCrawlerService.getSessionStats(streamerId);
      } else if (platform === 'twitch') {
        platformStats.twitch = twitchIrcService.getTwitchSessionStats(streamerId);
      }
    }

    return {
      streamerId: session.streamerId,
      isActive: session.isActive,
      totalMessages: session.totalMessages,
      platforms: platformStats,
      uptime: Date.now() - session.createdAt.getTime()
    };
  }
}

export const multiPlatformService = new MultiPlatformService();
```

## ✅ 完成驗證

### 🧪 **功能測試**
```markdown
測試清單：
- [ ] Twitch OAuth 認證流程完整
- [ ] Twitch IRC 連接穩定
- [ ] YouTube + Twitch 訊息統一顯示
- [ ] 跨平台訊息正確標識
- [ ] 雙平台併發穩定運行 > 2 小時
```

### 🔍 **整合驗證**
- [ ] 兩個平台訊息不會互相干擾
- [ ] 平台特有功能正確顯示 (徽章、顏色等)
- [ ] 重複訊息檢測機制運作
- [ ] 資源使用合理分配

---

**🎉 恭喜！** Twitch 整合系統完成，現在支援 YouTube + Twitch 雙平台！
