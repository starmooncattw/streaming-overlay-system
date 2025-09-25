# 02-Realtime Communication System - 即時通訊系統

> 🤖 **AI 使用指南**：此模組建立 WebSocket 通訊基礎，為後續聊天室整合提供穩定的即時訊息推送機制。AI 應確保 WebSocket 連接穩定且支援自動重連。

## 🔄 前置需求檢查

### 📋 **必要條件**
- [ ] **依賴文檔**: 01-基礎系統架構 (必須先完成)
- [ ] **必要工具**: Node.js 18+、已設定的 Firebase 專案
- [ ] **技能需求**: 🟡 中等 - WebSocket 基礎概念、後端 API 開發
- [ ] **預估時間**: ⏱️ 1-2 週 (每日 2-4 小時)

### 🎯 **完成後可獲得**
- ✅ 穩定的 WebSocket 通訊系統
- ✅ 多設備同步功能
- ✅ 訊息暫存和歷史載入機制
- ✅ 自動重連和錯誤恢復機制
- ✅ 為聊天室整合做好準備

## 🎯 本階段目標

### 🏗️ **主要任務**
建立可靠的即時通訊基礎設施，支援多設備同步和訊息持久化。

### 📊 **完成標準**
- WebSocket 連接穩定，支援自動重連
- 多設備間訊息即時同步 (延遲 < 3 秒)
- 訊息暫存機制運作正常
- 連線品質監控和告警機制
- 支援 100+ 訊息/分鐘處理量

## 🔧 詳細執行步驟

### 🚨 第一步：後端 WebSocket 服務建立
**位置**: backend/ 目錄
**目標**: 建立 Socket.IO 伺服器
**🎯 用戶情境**: 🟡 INTERMEDIATE | 🔴 ADVANCED

#### 💻 1.1 初始化後端專案
```bash
# 📋 CHECKLIST - 建立後端專案結構
cd backend
npm init -y

# 安裝必要套件
npm install express socket.io cors dotenv
npm install firebase-admin
npm install @types/node @types/express typescript ts-node nodemon --save-dev

# 建立 TypeScript 配置
npx tsc --init
```

#### 💻 1.2 建立基礎伺服器
```typescript
// 📋 CHECKLIST - 建立 src/server.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// 中間件
app.use(cors());
app.use(express.json());

// 基礎路由
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// WebSocket 連接處理
io.on('connection', (socket) => {
  console.log('用戶連接:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('用戶斷線:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`伺服器運行於 port ${PORT}`);
});
```

**🔍 驗證方法**：
```bash
# 💻 COMMAND - 啟動後端服務
npm run dev
# 預期結果：伺服器啟動，訪問 http://localhost:3001/health 返回 OK
```

### 🚨 第二步：訊息管理系統
**位置**: backend/src/ 目錄
**目標**: 建立訊息暫存和管理機制
**🎯 用戶情境**: 🟡 INTERMEDIATE | 🔴 ADVANCED

#### 💻 2.1 建立訊息模型
```typescript
// 📋 CHECKLIST - 建立 src/types/message.ts
export interface ChatMessage {
  id: string;
  streamerId: string;
  username: string;
  message: string;
  timestamp: Date;
  platform: 'youtube' | 'twitch' | 'test';
  metadata?: {
    userId?: string;
    badges?: string[];
    emotes?: any[];
    color?: string;
  };
}

export interface MessageRoom {
  streamerId: string;
  messages: ChatMessage[];
  connectedClients: Set<string>;
  lastActivity: Date;
}
```

#### 💻 2.2 建立訊息服務
```typescript
// 📋 CHECKLIST - 建立 src/services/messageService.ts
import { ChatMessage, MessageRoom } from '../types/message';

class MessageService {
  private rooms: Map<string, MessageRoom> = new Map();
  private readonly MAX_MESSAGES_PER_ROOM = 100;
  private readonly ROOM_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30分鐘

  constructor() {
    // 定期清理非活躍房間
    setInterval(() => {
      this.cleanupInactiveRooms();
    }, this.ROOM_CLEANUP_INTERVAL);
  }

  // 獲取或建立房間
  getOrCreateRoom(streamerId: string): MessageRoom {
    if (!this.rooms.has(streamerId)) {
      this.rooms.set(streamerId, {
        streamerId,
        messages: [],
        connectedClients: new Set(),
        lastActivity: new Date()
      });
    }
    return this.rooms.get(streamerId)!;
  }

  // 添加訊息到房間
  addMessage(streamerId: string, message: ChatMessage): void {
    const room = this.getOrCreateRoom(streamerId);
    
    // 添加訊息
    room.messages.push(message);
    room.lastActivity = new Date();
    
    // 限制訊息數量
    if (room.messages.length > this.MAX_MESSAGES_PER_ROOM) {
      room.messages = room.messages.slice(-this.MAX_MESSAGES_PER_ROOM);
    }
  }

  // 獲取房間歷史訊息
  getMessages(streamerId: string, limit: number = 50): ChatMessage[] {
    const room = this.rooms.get(streamerId);
    if (!room) return [];
    
    return room.messages.slice(-limit);
  }

  // 客戶端加入房間
  joinRoom(streamerId: string, clientId: string): void {
    const room = this.getOrCreateRoom(streamerId);
    room.connectedClients.add(clientId);
    room.lastActivity = new Date();
  }

  // 客戶端離開房間
  leaveRoom(streamerId: string, clientId: string): void {
    const room = this.rooms.get(streamerId);
    if (room) {
      room.connectedClients.delete(clientId);
    }
  }

  // 清理非活躍房間
  private cleanupInactiveRooms(): void {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - this.ROOM_CLEANUP_INTERVAL);
    
    for (const [streamerId, room] of this.rooms.entries()) {
      if (room.connectedClients.size === 0 && room.lastActivity < cutoffTime) {
        this.rooms.delete(streamerId);
        console.log(`清理非活躍房間: ${streamerId}`);
      }
    }
  }

  // 獲取房間統計
  getRoomStats(streamerId: string) {
    const room = this.rooms.get(streamerId);
    if (!room) return null;
    
    return {
      messageCount: room.messages.length,
      connectedClients: room.connectedClients.size,
      lastActivity: room.lastActivity
    };
  }
}

export const messageService = new MessageService();
```

### 🚨 第三步：WebSocket 事件處理
**位置**: backend/src/ 目錄
**目標**: 實現完整的 WebSocket 事件系統
**🎯 用戶情境**: 🟡 INTERMEDIATE | 🔴 ADVANCED

#### 💻 3.1 建立 Socket 處理器
```typescript
// 📋 CHECKLIST - 建立 src/handlers/socketHandler.ts
import { Server, Socket } from 'socket.io';
import { messageService } from '../services/messageService';
import { ChatMessage } from '../types/message';
import { v4 as uuidv4 } from 'uuid';

export class SocketHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`客戶端連接: ${socket.id}`);
      
      // 加入房間
      socket.on('join-room', (data: { streamerId: string }) => {
        this.handleJoinRoom(socket, data.streamerId);
      });

      // 離開房間
      socket.on('leave-room', (data: { streamerId: string }) => {
        this.handleLeaveRoom(socket, data.streamerId);
      });

      // 發送測試訊息
      socket.on('send-test-message', (data: { streamerId: string; message: string; username: string }) => {
        this.handleTestMessage(socket, data);
      });

      // 獲取歷史訊息
      socket.on('get-history', (data: { streamerId: string; limit?: number }) => {
        this.handleGetHistory(socket, data);
      });

      // 心跳檢測
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // 斷線處理
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoinRoom(socket: Socket, streamerId: string): void {
    try {
      // 加入 Socket.IO 房間
      socket.join(streamerId);
      
      // 記錄到訊息服務
      messageService.joinRoom(streamerId, socket.id);
      
      // 發送歷史訊息
      const history = messageService.getMessages(streamerId, 20);
      socket.emit('message-history', { messages: history });
      
      // 發送房間統計
      const stats = messageService.getRoomStats(streamerId);
      socket.emit('room-stats', stats);
      
      console.log(`客戶端 ${socket.id} 加入房間 ${streamerId}`);
    } catch (error) {
      console.error('加入房間失敗:', error);
      socket.emit('error', { message: '加入房間失敗' });
    }
  }

  private handleLeaveRoom(socket: Socket, streamerId: string): void {
    try {
      socket.leave(streamerId);
      messageService.leaveRoom(streamerId, socket.id);
      console.log(`客戶端 ${socket.id} 離開房間 ${streamerId}`);
    } catch (error) {
      console.error('離開房間失敗:', error);
    }
  }

  private handleTestMessage(socket: Socket, data: { streamerId: string; message: string; username: string }): void {
    try {
      const message: ChatMessage = {
        id: uuidv4(),
        streamerId: data.streamerId,
        username: data.username,
        message: data.message,
        timestamp: new Date(),
        platform: 'test'
      };

      // 儲存訊息
      messageService.addMessage(data.streamerId, message);
      
      // 廣播到房間內所有客戶端
      this.io.to(data.streamerId).emit('new-message', message);
      
      console.log(`測試訊息發送到房間 ${data.streamerId}: ${data.message}`);
    } catch (error) {
      console.error('發送測試訊息失敗:', error);
      socket.emit('error', { message: '發送訊息失敗' });
    }
  }

  private handleGetHistory(socket: Socket, data: { streamerId: string; limit?: number }): void {
    try {
      const messages = messageService.getMessages(data.streamerId, data.limit || 50);
      socket.emit('message-history', { messages });
    } catch (error) {
      console.error('獲取歷史訊息失敗:', error);
      socket.emit('error', { message: '獲取歷史失敗' });
    }
  }

  private handleDisconnect(socket: Socket): void {
    console.log(`客戶端斷線: ${socket.id}`);
    // Socket.IO 會自動處理房間清理
  }

  // 廣播訊息到特定房間
  public broadcastMessage(streamerId: string, message: ChatMessage): void {
    messageService.addMessage(streamerId, message);
    this.io.to(streamerId).emit('new-message', message);
  }

  // 獲取連線統計
  public getConnectionStats(): any {
    return {
      totalConnections: this.io.engine.clientsCount,
      rooms: Array.from(this.io.sockets.adapter.rooms.keys())
    };
  }
}
```

### 🚨 第四步：前端 WebSocket 客戶端
**位置**: frontend/src/ 目錄
**目標**: 建立前端 WebSocket 連接和管理
**🎯 用戶情境**: 🟡 INTERMEDIATE

#### 💻 4.1 安裝前端套件
```bash
# 📋 CHECKLIST - 安裝 Socket.IO 客戶端
cd frontend
npm install socket.io-client
```

#### 💻 4.2 建立 WebSocket 服務
```typescript
// 📋 CHECKLIST - 建立 src/services/websocketService.ts
import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../types/message';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentRoom: string | null = null;

  // 事件監聽器
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.connect();
  }

  // 連接到 WebSocket 伺服器
  private connect(): void {
    const serverUrl = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:3001';
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventHandlers();
  }

  // 設定事件處理器
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // 連接成功
    this.socket.on('connect', () => {
      console.log('WebSocket 連接成功');
      this.reconnectAttempts = 0;
      this.emit('connected');
      
      // 重新加入房間
      if (this.currentRoom) {
        this.joinRoom(this.currentRoom);
      }
    });

    // 連接失敗
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket 連接失敗:', error);
      this.emit('connection-error', error);
      this.handleReconnect();
    });

    // 斷線
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket 斷線:', reason);
      this.emit('disconnected', reason);
      
      if (reason === 'io server disconnect') {
        // 伺服器主動斷線，嘗試重連
        this.handleReconnect();
      }
    });

    // 新訊息
    this.socket.on('new-message', (message: ChatMessage) => {
      this.emit('new-message', message);
    });

    // 歷史訊息
    this.socket.on('message-history', (data: { messages: ChatMessage[] }) => {
      this.emit('message-history', data.messages);
    });

    // 房間統計
    this.socket.on('room-stats', (stats: any) => {
      this.emit('room-stats', stats);
    });

    // 心跳回應
    this.socket.on('pong', (data: { timestamp: number }) => {
      const latency = Date.now() - data.timestamp;
      this.emit('latency', latency);
    });

    // 錯誤處理
    this.socket.on('error', (error: any) => {
      console.error('WebSocket 錯誤:', error);
      this.emit('error', error);
    });
  }

  // 處理重連邏輯
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('達到最大重連次數，停止重連');
      this.emit('max-reconnect-attempts');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 指數退避
    
    console.log(`${delay}ms 後嘗試第 ${this.reconnectAttempts} 次重連`);
    
    setTimeout(() => {
      if (this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  // 加入房間
  public joinRoom(streamerId: string): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('WebSocket 未連接，無法加入房間');
      return;
    }

    this.currentRoom = streamerId;
    this.socket.emit('join-room', { streamerId });
  }

  // 離開房間
  public leaveRoom(streamerId: string): void {
    if (!this.socket) return;

    this.socket.emit('leave-room', { streamerId });
    if (this.currentRoom === streamerId) {
      this.currentRoom = null;
    }
  }

  // 發送測試訊息
  public sendTestMessage(streamerId: string, message: string, username: string): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('WebSocket 未連接，無法發送訊息');
      return;
    }

    this.socket.emit('send-test-message', { streamerId, message, username });
  }

  // 獲取歷史訊息
  public getHistory(streamerId: string, limit?: number): void {
    if (!this.socket || !this.socket.connected) return;

    this.socket.emit('get-history', { streamerId, limit });
  }

  // 心跳檢測
  public ping(): void {
    if (!this.socket || !this.socket.connected) return;

    this.socket.emit('ping');
  }

  // 事件監聽
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  // 移除事件監聽
  public off(event: string, callback?: Function): void {
    if (!callback) {
      this.eventListeners.delete(event);
      return;
    }

    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 觸發事件
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(...args));
    }
  }

  // 獲取連接狀態
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // 斷開連接
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentRoom = null;
    this.eventListeners.clear();
  }
}

// 單例模式
export const websocketService = new WebSocketService();
```

## ✅ 完成驗證

### 🧪 **功能測試**
```markdown
測試清單：
- [ ] WebSocket 伺服器正常啟動
- [ ] 前端可以成功連接到 WebSocket
- [ ] 加入房間功能正常
- [ ] 測試訊息發送和接收正常
- [ ] 歷史訊息載入功能正常
- [ ] 自動重連機制運作
- [ ] 心跳檢測功能正常
```

### 🔍 **效能驗證**
- [ ] 訊息延遲 < 3 秒
- [ ] 支援 10+ 同時連線
- [ ] 記憶體使用穩定
- [ ] 重連成功率 > 95%

---

**🎉 恭喜！** 即時通訊系統建立完成，現在可以進行下一階段的 YouTube 整合開發！
