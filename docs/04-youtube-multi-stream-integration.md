# 04-YouTube Multi-Stream Integration - YouTube 多直播整合

> 🤖 **AI 使用指南**：此模組擴展單直播功能，支援同時監控多個 YouTube 頻道。AI 需特別注意資源管理和併發控制。

## 🔄 前置需求檢查

### 📋 **必要條件**
- [ ] **依賴文檔**: 03-YouTube 單直播整合 (必須先完成)
- [ ] **必要工具**: 已設定的 YouTube API、測試用的多個 YouTube 頻道
- [ ] **技能需求**: 🔴 進階 - 併發程式設計、資源管理、效能最佳化
- [ ] **預估時間**: ⏱️ 2-3 週 (每日 3-5 小時)

### 🎯 **完成後可獲得**
- ✅ 多頻道同時監控功能
- ✅ 跨頻道訊息統一管理
- ✅ 智能資源分配和負載平衡
- ✅ 進階過濾和去重機制
- ✅ 完整的會話管理介面

## 🎯 本階段目標

### 🏗️ **主要任務**
擴展系統支援多個 YouTube 頻道同時監控，實現統一的訊息管理和顯示。

### 📊 **完成標準**
- 支援同時監控 5+ YouTube 頻道
- 跨頻道訊息統一顯示和管理
- 資源使用最佳化，API 配額 < 80%
- 併發爬蟲穩定運行 > 4 小時
- 訊息去重和過濾機制完善

## 🔧 詳細執行步驟

### 🚨 第一步：多會話管理系統
**位置**: backend/src/ 目錄
**目標**: 建立併發爬蟲管理機制
**🎯 用戶情境**: 🔴 ADVANCED

#### 💻 1.1 擴展爬蟲服務
```typescript
// 📋 CHECKLIST - 更新 src/services/youtubeCrawlerService.ts
interface MultiStreamSession {
  streamerId: string;
  channels: Map<string, ChannelSession>;
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
  totalMessages: number;
}

interface ChannelSession {
  channelId: string;
  videoId: string;
  chatId: string;
  channelTitle: string;
  isActive: boolean;
  nextPageToken?: string;
  pollingInterval: number;
  errorCount: number;
  messageCount: number;
  lastMessageTime: Date;
}

class MultiStreamCrawlerService {
  private sessions: Map<string, MultiStreamSession> = new Map();
  private readonly MAX_CHANNELS_PER_SESSION = 5;
  private readonly MAX_TOTAL_CHANNELS = 20;
  private resourceMonitor: ResourceMonitor;

  constructor() {
    this.resourceMonitor = new ResourceMonitor();
    this.startResourceMonitoring();
  }

  // 建立多頻道會話
  async createMultiStreamSession(streamerId: string, channels: string[]): Promise<boolean> {
    try {
      if (channels.length > this.MAX_CHANNELS_PER_SESSION) {
        throw new Error(`超過每個會話最大頻道數量: ${this.MAX_CHANNELS_PER_SESSION}`);
      }

      const session: MultiStreamSession = {
        streamerId,
        channels: new Map(),
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
        totalMessages: 0
      };

      // 初始化各頻道會話
      for (const channelId of channels) {
        const channelSession = await this.initializeChannelSession(channelId);
        if (channelSession) {
          session.channels.set(channelId, channelSession);
        }
      }

      this.sessions.set(streamerId, session);
      this.startMultiStreamCrawling(session);

      console.log(`建立多頻道會話: ${streamerId}, 頻道數: ${session.channels.size}`);
      return true;
    } catch (error) {
      console.error('建立多頻道會話失敗:', error);
      return false;
    }
  }

  // 初始化頻道會話
  private async initializeChannelSession(channelId: string): Promise<ChannelSession | null> {
    try {
      // 搜尋頻道的進行中直播
      const liveStreams = await youtubeApiService.searchLiveStreams(`channel:${channelId}`, 1);
      
      if (liveStreams.length === 0) {
        console.warn(`頻道 ${channelId} 目前沒有進行中的直播`);
        return null;
      }

      const stream = liveStreams[0];
      
      return {
        channelId,
        videoId: stream.id,
        chatId: stream.chatId,
        channelTitle: stream.channelTitle,
        isActive: true,
        pollingInterval: 5000,
        errorCount: 0,
        messageCount: 0,
        lastMessageTime: new Date()
      };
    } catch (error) {
      console.error(`初始化頻道會話失敗 (${channelId}):`, error);
      return null;
    }
  }

  // 開始多頻道爬蟲
  private async startMultiStreamCrawling(session: MultiStreamSession): Promise<void> {
    const crawlingPromises: Promise<void>[] = [];

    for (const [channelId, channelSession] of session.channels) {
      const promise = this.crawlChannelMessages(session, channelSession);
      crawlingPromises.push(promise);
    }

    // 並行執行所有爬蟲
    try {
      await Promise.allSettled(crawlingPromises);
    } catch (error) {
      console.error('多頻道爬蟲執行錯誤:', error);
    }
  }

  // 爬取單一頻道訊息
  private async crawlChannelMessages(session: MultiStreamSession, channelSession: ChannelSession): Promise<void> {
    while (session.isActive && channelSession.isActive) {
      try {
        // 檢查資源使用情況
        if (!this.resourceMonitor.canProceed()) {
          await this.sleep(10000); // 資源不足時等待
          continue;
        }

        const result = await youtubeApiService.getChatMessages(
          channelSession.chatId,
          channelSession.nextPageToken
        );

        // 更新會話資訊
        channelSession.pollingInterval = result.pollingIntervalMillis || 5000;
        channelSession.nextPageToken = result.nextPageToken;
        channelSession.errorCount = 0;

        // 處理訊息
        const processedCount = await this.processChannelMessages(
          session.streamerId,
          channelSession,
          result.messages
        );

        channelSession.messageCount += processedCount;
        session.totalMessages += processedCount;
        session.lastActivity = new Date();
        channelSession.lastMessageTime = new Date();

        // 動態調整輪詢間隔
        const adjustedInterval = this.calculatePollingInterval(channelSession);
        await this.sleep(adjustedInterval);

      } catch (error) {
        console.error(`頻道爬蟲錯誤 (${channelSession.channelId}):`, error);
        channelSession.errorCount++;

        if (channelSession.errorCount >= 5) {
          console.error(`頻道 ${channelSession.channelId} 錯誤過多，停用`);
          channelSession.isActive = false;
          break;
        }

        await this.sleep(channelSession.pollingInterval * 2);
      }
    }
  }

  // 處理頻道訊息
  private async processChannelMessages(streamerId: string, channelSession: ChannelSession, messages: any[]): Promise<number> {
    let processedCount = 0;

    for (const item of messages) {
      const message = this.parseYouTubeMessage(item, streamerId, channelSession);
      if (message && !this.isDuplicateMessage(message)) {
        messageService.addMessage(streamerId, message);
        processedCount++;
      }
    }

    return processedCount;
  }

  // 解析 YouTube 訊息 (多頻道版本)
  private parseYouTubeMessage(item: any, streamerId: string, channelSession: ChannelSession): ChatMessage | null {
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
          color: '#1976d2',
          sourceChannel: channelSession.channelTitle,
          sourceChannelId: channelSession.channelId,
          videoId: channelSession.videoId
        }
      };
    } catch (error) {
      console.error('解析多頻道訊息失敗:', error);
      return null;
    }
  }

  // 重複訊息檢測
  private isDuplicateMessage(message: ChatMessage): boolean {
    // 實現重複訊息檢測邏輯
    // 可以基於 userId + message + 時間窗口
    return false; // 簡化實現
  }

  // 動態調整輪詢間隔
  private calculatePollingInterval(channelSession: ChannelSession): number {
    const baseInterval = channelSession.pollingInterval;
    const errorMultiplier = Math.pow(1.5, channelSession.errorCount);
    const activityMultiplier = channelSession.messageCount > 0 ? 0.8 : 1.2;
    
    return Math.min(baseInterval * errorMultiplier * activityMultiplier, 30000);
  }

  // 工具函數
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 🚨 第二步：資源監控系統
**位置**: backend/src/ 目錄
**目標**: 監控 API 配額和系統資源
**🎯 用戶情境**: 🔴 ADVANCED

#### 💻 2.1 建立資源監控器
```typescript
// 📋 CHECKLIST - 建立 src/services/resourceMonitor.ts
interface ResourceUsage {
  apiQuotaUsed: number;
  apiQuotaLimit: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  timestamp: Date;
}

class ResourceMonitor {
  private usage: ResourceUsage;
  private readonly QUOTA_WARNING_THRESHOLD = 0.8;
  private readonly MEMORY_WARNING_THRESHOLD = 500 * 1024 * 1024; // 500MB

  constructor() {
    this.usage = {
      apiQuotaUsed: 0,
      apiQuotaLimit: 10000, // YouTube API 每日配額
      memoryUsage: 0,
      cpuUsage: 0,
      activeConnections: 0,
      timestamp: new Date()
    };
  }

  // 檢查是否可以繼續執行
  canProceed(): boolean {
    this.updateUsage();
    
    // 檢查 API 配額
    if (this.usage.apiQuotaUsed / this.usage.apiQuotaLimit > this.QUOTA_WARNING_THRESHOLD) {
      console.warn('API 配額接近上限，暫停請求');
      return false;
    }

    // 檢查記憶體使用
    if (this.usage.memoryUsage > this.MEMORY_WARNING_THRESHOLD) {
      console.warn('記憶體使用過高，暫停處理');
      return false;
    }

    return true;
  }

  // 更新資源使用情況
  private updateUsage(): void {
    const memUsage = process.memoryUsage();
    
    this.usage.memoryUsage = memUsage.heapUsed;
    this.usage.timestamp = new Date();
    
    // 這裡可以添加更多監控指標
  }

  // 記錄 API 使用
  recordApiUsage(cost: number): void {
    this.usage.apiQuotaUsed += cost;
  }

  // 獲取使用統計
  getUsageStats(): ResourceUsage {
    this.updateUsage();
    return { ...this.usage };
  }
}
```

### 🚨 第三步：前端多頻道管理介面
**位置**: frontend/src/ 目錄
**目標**: 建立多頻道管理 UI
**🎯 用戶情境**: 🟡 INTERMEDIATE

#### 💻 3.1 建立多頻道控制台
```tsx
// 📋 CHECKLIST - 建立 src/pages/MultiChannelDashboard.tsx
import React, { useState, useEffect } from 'react';

interface ChannelConfig {
  channelId: string;
  channelTitle: string;
  isActive: boolean;
  messageCount: number;
  lastActivity: Date;
}

export const MultiChannelDashboard: React.FC = () => {
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [newChannelId, setNewChannelId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 添加頻道
  const handleAddChannel = async () => {
    if (!newChannelId.trim()) return;
    
    setIsLoading(true);
    try {
      // 驗證頻道並添加
      const response = await fetch('/api/youtube/add-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: newChannelId })
      });
      
      if (response.ok) {
        const channelData = await response.json();
        setChannels(prev => [...prev, channelData]);
        setNewChannelId('');
      }
    } catch (error) {
      console.error('添加頻道失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 移除頻道
  const handleRemoveChannel = async (channelId: string) => {
    try {
      await fetch(`/api/youtube/remove-channel/${channelId}`, {
        method: 'DELETE'
      });
      
      setChannels(prev => prev.filter(ch => ch.channelId !== channelId));
    } catch (error) {
      console.error('移除頻道失敗:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">多頻道管理</h1>
      
      {/* 添加頻道區域 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">添加新頻道</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newChannelId}
            onChange={(e) => setNewChannelId(e.target.value)}
            placeholder="輸入 YouTube 頻道 ID 或 URL"
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={handleAddChannel}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? '添加中...' : '添加頻道'}
          </button>
        </div>
      </div>

      {/* 頻道列表 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">監控中的頻道 ({channels.length})</h2>
        </div>
        
        <div className="divide-y">
          {channels.map((channel) => (
            <div key={channel.channelId} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${channel.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <h3 className="font-medium">{channel.channelTitle}</h3>
                  <p className="text-sm text-gray-500">ID: {channel.channelId}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-lg font-semibold">{channel.messageCount}</div>
                  <div className="text-xs text-gray-500">訊息數</div>
                </div>
                
                <div className="text-center">
                  <div className="text-sm">{channel.lastActivity.toLocaleTimeString()}</div>
                  <div className="text-xs text-gray-500">最後活動</div>
                </div>
                
                <button
                  onClick={() => handleRemoveChannel(channel.channelId)}
                  className="text-red-600 hover:text-red-800"
                >
                  移除
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {channels.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            尚未添加任何頻道
          </div>
        )}
      </div>
    </div>
  );
};
```

## ✅ 完成驗證

### 🧪 **功能測試**
```markdown
測試清單：
- [ ] 可同時監控 3+ YouTube 頻道
- [ ] 跨頻道訊息統一顯示
- [ ] 資源監控和告警正常
- [ ] 頻道添加/移除功能正常
- [ ] 併發爬蟲穩定運行 > 2 小時
```

### 📊 **效能驗證**
- [ ] API 配額使用率 < 80%
- [ ] 記憶體使用穩定 < 500MB
- [ ] CPU 使用率 < 70%
- [ ] 訊息處理延遲 < 10 秒

---

**🎉 恭喜！** YouTube 多直播整合完成，現在可以進行 Twitch 整合或其他擴展功能開發！
