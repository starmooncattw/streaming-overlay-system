import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger';
import { query } from '../config/database';
import { User } from '../types/auth';

interface AuthenticatedSocket extends Socket {
  user?: User;
}

// Socket.IO 伺服器初始化
export function initializeSocket(io: SocketIOServer): void {
  logger.info('正在初始化 Socket.IO 服務...');

  // 中間件：Socket 認證（可選）
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (token) {
        // 如果有 token，驗證它
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          
          if (decoded.userId && decoded.userCode) {
            const userResult = await query(
              'SELECT id, user_id, email FROM users WHERE id = $1 AND is_active = true',
              [decoded.userId]
            );

            if (userResult.rows.length > 0) {
              const user = userResult.rows[0];
              socket.user = {
                userId: user.id,
                userCode: user.user_id,
                email: user.email
              };
              logger.debug(`Socket 認證成功: ${user.user_id} (${socket.id})`);
            }
          }
        } catch (tokenError) {
          logger.debug(`Socket token 驗證失敗: ${tokenError}`);
        }
      }

      // 無論是否認證成功都允許連接（因為顯示頁面不需要認證）
      next();
    } catch (error) {
      logger.error('Socket 認證中間件錯誤:', error);
      next(); // 允許連接但不設定使用者資訊
    }
  });

  // Socket 連接處理
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket 客戶端已連接: ${socket.id}${socket.user ? ` (${socket.user.userCode})` : ' (匿名)'}`);

    // 加入使用者房間（如果有認證）
    if (socket.user) {
      socket.join(`user:${socket.user.userCode}`);
      logger.debug(`Socket 加入使用者房間: user:${socket.user.userCode}`);
    }

    // 處理客戶端事件
    handleSocketEvents(socket, io);

    // 連接斷開處理
    socket.on('disconnect', (reason) => {
      logger.info(`Socket 客戶端已斷開: ${socket.id} - 原因: ${reason}`);
    });

    // 錯誤處理
    socket.on('error', (error) => {
      logger.error(`Socket 錯誤 (${socket.id}):`, error);
    });
  });

  logger.info('Socket.IO 服務初始化完成');
}

// 處理 Socket 事件
function handleSocketEvents(socket: AuthenticatedSocket, io: SocketIOServer): void {
  
  // 訂閱特定使用者的更新
  socket.on('subscribe', (data: { userId: string, type: string }) => {
    try {
      const { userId, type } = data;
      const roomName = `${type}:${userId}`;
      
      socket.join(roomName);
      logger.debug(`Socket ${socket.id} 訂閱房間: ${roomName}`);
      
      socket.emit('subscribed', { 
        success: true, 
        room: roomName,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Socket 訂閱失敗:', error);
      socket.emit('subscription-error', { 
        success: false, 
        message: 'Subscription failed' 
      });
    }
  });

  // 取消訂閱
  socket.on('unsubscribe', (data: { userId: string, type: string }) => {
    try {
      const { userId, type } = data;
      const roomName = `${type}:${userId}`;
      
      socket.leave(roomName);
      logger.debug(`Socket ${socket.id} 取消訂閱房間: ${roomName}`);
      
      socket.emit('unsubscribed', { 
        success: true, 
        room: roomName,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Socket 取消訂閱失敗:', error);
      socket.emit('unsubscription-error', { 
        success: false, 
        message: 'Unsubscription failed' 
      });
    }
  });

  // 心跳檢測
  socket.on('ping', () => {
    socket.emit('pong', {
      timestamp: new Date().toISOString(),
      server: 'streaming-overlay-backend'
    });
  });

  // 取得連接狀態
  socket.on('get-status', () => {
    socket.emit('status', {
      connected: true,
      socketId: socket.id,
      user: socket.user || null,
      timestamp: new Date().toISOString(),
      rooms: Array.from(socket.rooms)
    });
  });

  // 測試事件（開發環境使用）
  if (process.env.NODE_ENV !== 'production') {
    socket.on('test-emit', (data) => {
      logger.debug(`測試事件接收: ${JSON.stringify(data)}`);
      socket.emit('test-response', {
        received: data,
        timestamp: new Date().toISOString()
      });
    });
  }
}

// Socket 發送工具函數
export class SocketEmitter {
  
  // 發送聊天訊息更新
  static emitChatMessage(io: SocketIOServer, userId: string, messageData: any): void {
    try {
      const roomName = `chat:${userId}`;
      io.to(roomName).emit(`chat:${userId}`, messageData);
      logger.debug(`發送聊天訊息到房間 ${roomName}:`, messageData);
    } catch (error) {
      logger.error('發送聊天訊息失敗:', error);
    }
  }

  // 發送斗內進度更新
  static emitDonationProgress(io: SocketIOServer, userId: string, progressData: any): void {
    try {
      const roomName = `donation:${userId}`;
      io.to(roomName).emit(`donation:${userId}`, progressData);
      logger.debug(`發送斗內進度到房間 ${roomName}:`, progressData);
    } catch (error) {
      logger.error('發送斗內進度失敗:', error);
    }
  }

  // 發送樣式更新
  static emitStyleUpdate(io: SocketIOServer, userId: string, styleData: any): void {
    try {
      const roomName = `user:${userId}`;
      io.to(roomName).emit('style-updated', styleData);
      logger.debug(`發送樣式更新到房間 ${roomName}:`, styleData);
    } catch (error) {
      logger.error('發送樣式更新失敗:', error);
    }
  }

  // 發送系統通知
  static emitSystemNotification(io: SocketIOServer, userId: string, notification: any): void {
    try {
      const roomName = `user:${userId}`;
      io.to(roomName).emit('notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
      logger.debug(`發送系統通知到房間 ${roomName}:`, notification);
    } catch (error) {
      logger.error('發送系統通知失敗:', error);
    }
  }

  // 廣播給所有連接的客戶端
  static broadcastToAll(io: SocketIOServer, event: string, data: any): void {
    try {
      io.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
      logger.debug(`廣播事件 ${event}:`, data);
    } catch (error) {
      logger.error('廣播事件失敗:', error);
    }
  }

  // 取得房間中的客戶端數量
  static async getRoomSize(io: SocketIOServer, roomName: string): Promise<number> {
    try {
      const room = io.sockets.adapter.rooms.get(roomName);
      return room ? room.size : 0;
    } catch (error) {
      logger.error('取得房間大小失敗:', error);
      return 0;
    }
  }

  // 取得所有房間資訊
  static getRoomsInfo(io: SocketIOServer): any {
    try {
      const rooms = Array.from(io.sockets.adapter.rooms.keys())
        .filter(room => !io.sockets.sockets.has(room)) // 排除 socket ID
        .map(room => ({
          name: room,
          size: io.sockets.adapter.rooms.get(room)?.size || 0
        }));

      return {
        totalRooms: rooms.length,
        rooms: rooms,
        totalConnections: io.sockets.sockets.size
      };
    } catch (error) {
      logger.error('取得房間資訊失敗:', error);
      return { totalRooms: 0, rooms: [], totalConnections: 0 };
    }
  }
}