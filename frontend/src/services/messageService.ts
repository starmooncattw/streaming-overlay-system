import { ref, push, onValue, off, query, limitToLast, remove } from 'firebase/database';
import { realtimeDb } from '../config/firebase';
import { ChatMessage } from '../types/style';

/**
 * 訊息服務 - 使用 Firebase Realtime Database
 */
export const messageService = {
  /**
   * 發送訊息到指定用戶的訊息頻道
   */
  sendMessage: async (userId: string, message: ChatMessage): Promise<void> => {
    try {
      const messagesRef = ref(realtimeDb, `messages/${userId}`);
      await push(messagesRef, {
        ...message,
        timestamp: message.timestamp.toISOString()
      });
    } catch (error) {
      console.error('發送訊息失敗:', error);
      throw error;
    }
  },

  /**
   * 監聽用戶的訊息 (最近 50 條)
   */
  subscribeToMessages: (
    userId: string,
    callback: (messages: ChatMessage[]) => void
  ): (() => void) => {
    const messagesRef = ref(realtimeDb, `messages/${userId}`);
    const messagesQuery = query(messagesRef, limitToLast(50));

    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        messages.push({
          ...data,
          timestamp: new Date(data.timestamp)
        });
      });
      callback(messages);
    });

    // 返回取消訂閱函數
    return () => off(messagesQuery);
  },

  /**
   * 清除用戶的所有訊息
   */
  clearMessages: async (userId: string): Promise<void> => {
    try {
      const messagesRef = ref(realtimeDb, `messages/${userId}`);
      await remove(messagesRef);
    } catch (error) {
      console.error('清除訊息失敗:', error);
      throw error;
    }
  }
};
