# 09-Advanced Features System - 進階功能系統

> 🤖 **AI 使用指南**：此模組實現進階功能，包含時間顯示、Loading 頁面和聊天室分析功能。AI 需特別注意用戶體驗和數據分析的準確性。

## 🔄 前置需求檢查

### 📋 **必要條件**
- [ ] **依賴文檔**: 01-基礎系統架構、02-即時通訊系統 (必須先完成)
- [ ] **建議依賴**: 03-YouTube 整合、05-Twitch 整合 (提升分析效果)
- [ ] **必要工具**: 數據分析基礎、UI/UX 設計概念
- [ ] **技能需求**: 🟡 中等 - 數據處理、圖表顯示、動畫效果
- [ ] **預估時間**: ⏱️ 2-3 週 (每日 2-4 小時)

### 🎯 **完成後可獲得**
- ✅ 多樣化時間顯示功能
- ✅ 專業 Loading 頁面系統
- ✅ 智能聊天室分析功能
- ✅ 數據視覺化圖表
- ✅ 增強的用戶體驗

## 🎯 本階段目標

### 🏗️ **主要任務**
建立進階功能系統，提升直播工具的專業性和實用性。

### 📊 **完成標準**
- 時間顯示準確且樣式豐富
- Loading 頁面流暢美觀
- 聊天分析數據準確
- 圖表顯示清晰易懂
- 所有功能與 OBS 完美整合

## 🔧 詳細執行步驟

### 🚨 第一步：時間顯示系統
**位置**: frontend/src/ 目錄
**目標**: 建立多樣化時間顯示功能
**🎯 用戶情境**: 🟡 INTERMEDIATE

#### 💻 1.1 建立時間數據類型
```typescript
// 📋 CHECKLIST - 建立 src/types/timeDisplay.ts
export interface TimeDisplayConfig {
  id: string;
  streamerId: string;
  name: string;
  type: 'current' | 'countdown' | 'elapsed' | 'custom';
  format: '12h' | '24h' | 'custom';
  timezone: string;
  customFormat?: string;
  countdownTarget?: Date;
  startTime?: Date;
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
    shadow?: boolean;
    animation?: 'none' | 'pulse' | 'fade' | 'slide';
  };
  position: {
    x: number;
    y: number;
    anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 💻 1.2 建立時間顯示組件
```typescript
// 📋 CHECKLIST - 建立 src/components/TimeDisplay.tsx
import React, { useState, useEffect } from 'react';
import { TimeDisplayConfig } from '../types/timeDisplay';

interface TimeDisplayProps {
  config: TimeDisplayConfig;
  isPreview?: boolean;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({ config, isPreview = false }) => {
  const [displayTime, setDisplayTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let timeString = '';

      switch (config.type) {
        case 'current':
          timeString = formatCurrentTime(now, config);
          break;
        case 'countdown':
          if (config.countdownTarget) {
            const remaining = config.countdownTarget.getTime() - now.getTime();
            timeString = formatCountdown(remaining);
          }
          break;
        case 'elapsed':
          if (config.startTime) {
            const elapsed = now.getTime() - config.startTime.getTime();
            timeString = formatElapsed(elapsed);
          }
          break;
        case 'custom':
          timeString = formatCustomTime(now, config);
          break;
      }

      setDisplayTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [config]);

  const formatCurrentTime = (date: Date, config: TimeDisplayConfig): string => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: config.format === '12h',
      timeZone: config.timezone
    };
    return date.toLocaleTimeString('zh-TW', options);
  };

  const formatCountdown = (milliseconds: number): string => {
    if (milliseconds <= 0) return '00:00:00';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatElapsed = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCustomTime = (date: Date, config: TimeDisplayConfig): string => {
    return config.customFormat || date.toLocaleString();
  };

  return (
    <div
      className="time-display"
      style={{
        position: 'absolute',
        left: `${config.position.x}px`,
        top: `${config.position.y}px`,
        fontSize: `${config.style.fontSize}px`,
        fontFamily: config.style.fontFamily,
        color: config.style.color,
        backgroundColor: config.style.backgroundColor,
        borderRadius: config.style.borderRadius ? `${config.style.borderRadius}px` : undefined,
        padding: config.style.padding ? `${config.style.padding}px` : undefined,
        boxShadow: config.style.shadow ? '0 2px 4px rgba(0,0,0,0.3)' : undefined,
        userSelect: 'none',
        pointerEvents: 'none'
      }}
    >
      {displayTime}
    </div>
  );
};
```

### 🚨 第二步：Loading 頁面系統
**位置**: frontend/src/ 目錄
**目標**: 建立專業 Loading 頁面
**🎯 用戶情境**: 🟡 INTERMEDIATE

#### 💻 2.1 建立 Loading 組件
```typescript
// 📋 CHECKLIST - 建立 src/components/LoadingScreen.tsx
import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  type?: 'spinner' | 'progress' | 'dots' | 'wave';
  message?: string;
  progress?: number;
  style?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    fontSize?: number;
  };
  onComplete?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  type = 'spinner',
  message = '載入中...',
  progress = 0,
  style = {},
  onComplete
}) => {
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (progress >= 100 && onComplete) {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  const defaultStyle = {
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    accentColor: '#3b82f6',
    fontSize: 18,
    ...style
  };

  const renderLoadingAnimation = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className="relative w-16 h-16">
            <div 
              className="absolute inset-0 border-4 border-gray-600 rounded-full border-t-blue-500 animate-spin"
            />
          </div>
        );

      case 'progress':
        return (
          <div className="w-64 space-y-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  backgroundColor: defaultStyle.accentColor,
                  width: `${progress}%`
                }}
              />
            </div>
            <div className="text-center" style={{ color: defaultStyle.textColor }}>
              {progress}%
            </div>
          </div>
        );

      case 'dots':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-3 h-3 rounded-full animate-bounce"
                style={{
                  backgroundColor: defaultStyle.accentColor,
                  animationDelay: `${i * 0.16}s`
                }}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ backgroundColor: defaultStyle.backgroundColor }}
    >
      <div className="flex flex-col items-center space-y-6">
        {renderLoadingAnimation()}
        
        <div 
          className="text-center font-medium"
          style={{ 
            color: defaultStyle.textColor,
            fontSize: `${defaultStyle.fontSize}px`
          }}
        >
          {message}
        </div>
      </div>
    </div>
  );
};
```

### 🚨 第三步：聊天室分析功能
**位置**: backend/src/ 目錄
**目標**: 建立智能聊天分析系統
**🎯 用戶情境**: 🔴 ADVANCED

#### 💻 3.1 建立分析數據類型
```typescript
// 📋 CHECKLIST - 建立 src/types/analytics.ts
export interface ChatAnalytics {
  streamerId: string;
  sessionId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  messageStats: {
    totalMessages: number;
    averagePerMinute: number;
    platformBreakdown: {
      youtube: number;
      twitch: number;
      donation: number;
    };
  };
  userStats: {
    totalUsers: number;
    mostActiveUsers: {
      username: string;
      messageCount: number;
      platform: string;
    }[];
  };
  contentAnalysis: {
    topKeywords: {
      word: string;
      count: number;
      sentiment?: 'positive' | 'negative' | 'neutral';
    }[];
    emotionBreakdown: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
  createdAt: Date;
}
```

#### 💻 3.2 建立分析服務
```typescript
// 📋 CHECKLIST - 建立 src/services/analyticsService.ts
import { ChatMessage } from '../types/message';
import { ChatAnalytics } from '../types/analytics';

class AnalyticsService {
  private messageBuffer: Map<string, ChatMessage[]> = new Map();

  // 添加訊息到分析緩衝區
  addMessage(streamerId: string, message: ChatMessage): void {
    if (!this.messageBuffer.has(streamerId)) {
      this.messageBuffer.set(streamerId, []);
    }
    
    const messages = this.messageBuffer.get(streamerId)!;
    messages.push(message);
    
    // 保持最近 1000 條訊息
    if (messages.length > 1000) {
      messages.shift();
    }
  }

  // 生成分析報告
  async generateAnalytics(streamerId: string, timeRange: { start: Date; end: Date }): Promise<ChatAnalytics> {
    const messages = this.getMessagesInRange(streamerId, timeRange);
    
    return {
      streamerId,
      sessionId: this.generateSessionId(),
      timeRange,
      messageStats: this.calculateMessageStats(messages, timeRange),
      userStats: this.calculateUserStats(messages),
      contentAnalysis: this.analyzeContent(messages),
      createdAt: new Date()
    };
  }

  // 計算訊息統計
  private calculateMessageStats(messages: ChatMessage[], timeRange: { start: Date; end: Date }): any {
    const totalMessages = messages.length;
    const durationMinutes = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60);
    const averagePerMinute = totalMessages / durationMinutes;
    
    const platformBreakdown = {
      youtube: messages.filter(m => m.platform === 'youtube').length,
      twitch: messages.filter(m => m.platform === 'twitch').length,
      donation: messages.filter(m => m.platform === 'donation').length
    };
    
    return {
      totalMessages,
      averagePerMinute: Math.round(averagePerMinute * 100) / 100,
      platformBreakdown
    };
  }

  // 分析內容
  private analyzeContent(messages: ChatMessage[]): any {
    const words = this.extractKeywords(messages);
    const topKeywords = this.getTopItems(words, 20).map(word => ({
      word,
      count: words.filter(w => w === word).length,
      sentiment: this.analyzeSentiment(word)
    }));
    
    const emotions = messages.map(m => this.analyzeSentiment(m.message));
    const emotionBreakdown = {
      positive: emotions.filter(e => e === 'positive').length,
      negative: emotions.filter(e => e === 'negative').length,
      neutral: emotions.filter(e => e === 'neutral').length
    };
    
    return {
      topKeywords,
      emotionBreakdown
    };
  }

  // 輔助方法
  private extractKeywords(messages: ChatMessage[]): string[] {
    const stopWords = new Set(['的', '是', '在', '了', '和', '有', '我', '你']);
    const words: string[] = [];
    
    messages.forEach(msg => {
      const messageWords = msg.message
        .toLowerCase()
        .replace(/[^\w\s\u4e00-\u9fff]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 1 && !stopWords.has(word));
      
      words.push(...messageWords);
    });
    
    return words;
  }

  private getTopItems(items: string[], limit: number): string[] {
    const counts = new Map<string, number>();
    items.forEach(item => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item]) => item);
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['好', '棒', '讚', '愛', '喜歡', '開心'];
    const negativeWords = ['壞', '爛', '討厭', '生氣', '難過'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateUserStats(messages: ChatMessage[]): any {
    const userMessages = new Map<string, number>();
    
    messages.forEach(msg => {
      const username = msg.username;
      userMessages.set(username, (userMessages.get(username) || 0) + 1);
    });
    
    const totalUsers = userMessages.size;
    const mostActiveUsers = Array.from(userMessages.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([username, messageCount]) => ({
        username,
        messageCount,
        platform: messages.find(m => m.username === username)?.platform || 'unknown'
      }));
    
    return {
      totalUsers,
      mostActiveUsers
    };
  }

  private getMessagesInRange(streamerId: string, timeRange: { start: Date; end: Date }): ChatMessage[] {
    const messages = this.messageBuffer.get(streamerId) || [];
    return messages.filter(msg => 
      msg.timestamp >= timeRange.start && msg.timestamp <= timeRange.end
    );
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const analyticsService = new AnalyticsService();
```

## ✅ 完成驗證

### 🧪 **功能測試**
```markdown
測試清單：
- [ ] 時間顯示準確且格式正確
- [ ] Loading 頁面動畫流暢
- [ ] 聊天分析數據準確
- [ ] 所有功能 OBS 整合正常
- [ ] 效能表現良好
```

---

**🎉 恭喜！** 進階功能系統完成，現在擁有專業級的時間顯示、Loading 頁面和智能聊天分析功能！
