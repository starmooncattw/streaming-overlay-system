import { io, Socket } from 'socket.io-client';
import { store } from '../store/store';
import { addRecentDonation } from '../store/slices/donationSlice';
import { updateViewerCount, updateStreamStatus } from '../store/slices/streamSlice';
import { addNotification, setWebsocketConnected } from '../store/slices/uiSlice';

// Socket.IO 客戶端配置
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentStreamerId: string | null = null;

  /**
   * 初始化 Socket 連接
   */
  connect(token?: string): void {
    if (this.socket?.connected) {
      console.log('Socket 已經連接');
      return;
    }

    console.log('🔌 正在連接到 Socket.IO 服務器...');

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token || localStorage.getItem('token')
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  /**
   * 設置事件監聽器
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // 連接成功
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO 連接成功');
      this.reconnectAttempts = 0;
      store.dispatch(setWebsocketConnected(true));
      
      store.dispatch(addNotification({
        type: 'success',
        title: '連接成功',
        message: '即時通訊已連接',
        duration: 3000
      }));

      // 如果有當前直播間，重新加入
      if (this.currentStreamerId) {
        this.joinStream(this.currentStreamerId);
      }
    });

    // 連接失敗
    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO 連接失敗:', error);
      store.dispatch(setWebsocketConnected(false));
      
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        store.dispatch(addNotification({
          type: 'error',
          title: '連接失敗',
          message: '無法連接到即時通訊服務器',
          duration: 5000
        }));
      }
    });

    // 斷線
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO 連接斷開:', reason);
      store.dispatch(setWebsocketConnected(false));
      
      if (reason === 'io server disconnect') {
        // 服務器主動斷開，需要手動重連
        this.socket?.connect();
      }
    });

    // 重連嘗試
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 重連嘗試 ${attemptNumber}/${this.maxReconnectAttempts}`);
    });

    // 重連成功
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ 重連成功 (嘗試 ${attemptNumber} 次)`);
      store.dispatch(addNotification({
        type: 'success',
        title: '重連成功',
        message: '即時通訊已恢復連接',
        duration: 3000
      }));
    });

    // 重連失敗
    this.socket.on('reconnect_failed', () => {
      console.error('❌ 重連失敗');
      store.dispatch(addNotification({
        type: 'error',
        title: '重連失敗',
        message: '無法恢復即時通訊連接',
        duration: 5000
      }));
    });

    // 新的斗內通知
    this.socket.on('new-donation', (donation) => {
      console.log('💰 收到新的斗內:', donation);
      store.dispatch(addRecentDonation(donation));
      
      store.dispatch(addNotification({
        type: 'success',
        title: '新的斗內',
        message: `${donation.donorName} 斗內了 ${donation.amount} ${donation.currency}`,
        duration: 5000
      }));
    });

    // 觀看人數更新
    this.socket.on('viewer-count-update', (data) => {
      console.log('👥 觀看人數更新:', data);
      store.dispatch(updateViewerCount(data.count));
    });

    // 直播狀態更新
    this.socket.on('stream-status-update', (data) => {
      console.log('📺 直播狀態更新:', data);
      store.dispatch(updateStreamStatus(data.isLive));
      
      const message = data.isLive ? '直播已開始' : '直播已結束';
      store.dispatch(addNotification({
        type: 'info',
        title: '直播狀態',
        message,
        duration: 3000
      }));
    });

    // 新的關注者
    this.socket.on('new-follower', (follower) => {
      console.log('👤 新的關注者:', follower);
      store.dispatch(addNotification({
        type: 'success',
        title: '新的關注者',
        message: `${follower.username} 開始關注你了`,
        duration: 4000
      }));
    });

    // 聊天訊息
    this.socket.on('chat-message', (message) => {
      console.log('💬 聊天訊息:', message);
      // 這裡可以添加聊天訊息的處理邏輯
    });

    // 系統通知
    this.socket.on('system-notification', (notification) => {
      console.log('🔔 系統通知:', notification);
      store.dispatch(addNotification({
        type: notification.type || 'info',
        title: notification.title || '系統通知',
        message: notification.message,
        duration: notification.duration || 5000
      }));
    });

    // 錯誤處理
    this.socket.on('error', (error) => {
      console.error('❌ Socket 錯誤:', error);
      store.dispatch(addNotification({
        type: 'error',
        title: '通訊錯誤',
        message: error.message || '即時通訊發生錯誤',
        duration: 5000
      }));
    });
  }

  /**
   * 加入直播間
   */
  joinStream(streamerId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket 未連接，無法加入直播間');
      return;
    }

    console.log(`🏠 加入直播間: ${streamerId}`);
    this.currentStreamerId = streamerId;
    this.socket.emit('join-stream', streamerId);
  }

  /**
   * 離開直播間
   */
  leaveStream(streamerId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket 未連接，無法離開直播間');
      return;
    }

    console.log(`🚪 離開直播間: ${streamerId}`);
    this.currentStreamerId = null;
    this.socket.emit('leave-stream', streamerId);
  }

  /**
   * 發送聊天訊息
   */
  sendChatMessage(streamerId: string, message: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket 未連接，無法發送聊天訊息');
      return;
    }

    this.socket.emit('chat-message', {
      streamerId,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 發送斗內
   */
  sendDonation(streamerId: string, donationData: {
    donorName: string;
    amount: number;
    currency: string;
    message?: string;
    isAnonymous?: boolean;
  }): void {
    if (!this.socket?.connected) {
      console.warn('Socket 未連接，無法發送斗內');
      return;
    }

    this.socket.emit('donation', {
      streamerId,
      ...donationData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 更新直播狀態
   */
  updateStreamStatus(streamerId: string, status: {
    isLive: boolean;
    title?: string;
    category?: string;
  }): void {
    if (!this.socket?.connected) {
      console.warn('Socket 未連接，無法更新直播狀態');
      return;
    }

    this.socket.emit('stream-status', {
      streamerId,
      ...status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 請求即時統計
   */
  requestStats(streamerId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket 未連接，無法請求統計');
      return;
    }

    this.socket.emit('request-stats', streamerId);
  }

  /**
   * 測試連接
   */
  testConnection(): void {
    if (!this.socket?.connected) {
      console.warn('Socket 未連接，無法測試連接');
      return;
    }

    const startTime = Date.now();
    this.socket.emit('ping', startTime);
    
    this.socket.once('pong', (timestamp) => {
      const latency = Date.now() - timestamp;
      console.log(`🏓 連接延遲: ${latency}ms`);
      
      store.dispatch(addNotification({
        type: 'info',
        title: '連接測試',
        message: `延遲: ${latency}ms`,
        duration: 3000
      }));
    });
  }

  /**
   * 斷開連接
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 斷開 Socket.IO 連接');
      
      // 離開當前直播間
      if (this.currentStreamerId) {
        this.leaveStream(this.currentStreamerId);
      }
      
      this.socket.disconnect();
      this.socket = null;
      this.currentStreamerId = null;
      store.dispatch(setWebsocketConnected(false));
    }
  }

  /**
   * 獲取連接狀態
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * 獲取當前直播間 ID
   */
  getCurrentStreamerId(): string | null {
    return this.currentStreamerId;
  }

  /**
   * 重新連接
   */
  reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.connect();
    }
  }

  /**
   * 更新認證令牌
   */
  updateAuthToken(token: string): void {
    if (this.socket) {
      this.socket.auth = { token };
      if (this.socket.connected) {
        this.socket.disconnect().connect();
      }
    }
  }
}

// 創建單例實例
export const socketService = new SocketService();

// 導出類型
export type { Socket };

// 默認導出
export default socketService;
