import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import io, { Socket } from 'socket.io-client';
import { api } from '../../services/api';

// 介面定義
interface ChatMessage {
  id: string;
  username: string;
  message: string;
  platform: 'manual' | 'youtube' | 'twitch';
  timestamp: string;
  isNew: boolean;
  isTest?: boolean;
}

interface ChatStyle {
  id: string;
  name: string;
  config: {
    fontFamily: string;
    fontSize: number;
    fontColor: string;
    backgroundColor: string;
    borderRadius: number;
    padding: number;
    maxMessages: number;
    animationType: 'slide' | 'fade' | 'bounce';
    position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
    showPlatform?: boolean;
    showTimestamp?: boolean;
  };
}

interface ChatDisplayData {
  style: ChatStyle;
  messages: ChatMessage[];
  lastUpdated: string;
}

const ChatDisplay: React.FC = () => {
  const { userId, styleId } = useParams<{ userId: string; styleId: string }>();
  const [data, setData] = useState<ChatDisplayData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // 獲取顯示資料
  const fetchDisplayData = async () => {
    try {
      if (!userId || !styleId) return;

      const response = await api.get(`/display/chat/${userId}/${styleId}`);
      
      if (response.data.success) {
        setData(response.data.data);
        setMessages(response.data.data.messages || []);
        setError(null);
      } else {
        throw new Error(response.data.message || 'Failed to load chat display');
      }
    } catch (err: any) {
      console.error('Failed to fetch chat display:', err);
      setError(err.response?.data?.message || err.message || '載入失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化 Socket 連接
  const initializeSocket = () => {
    if (!userId) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected for chat display');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // 監聽聊天訊息
    newSocket.on(`chat:${userId}`, (messageData: ChatMessage | { type: 'clear' }) => {
      if ('type' in messageData && messageData.type === 'clear') {
        setMessages([]);
        return;
      }

      const message = messageData as ChatMessage;
      
      setMessages(prev => {
        const newMessages = [...prev, message];
        const maxMessages = data?.style?.config?.maxMessages || 10;
        
        // 限制訊息數量
        if (newMessages.length > maxMessages) {
          return newMessages.slice(-maxMessages);
        }
        
        return newMessages;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  };

  // 初始化
  useEffect(() => {
    fetchDisplayData();
  }, [userId, styleId]);

  // Socket 初始化
  useEffect(() => {
    if (!data || !userId) return;

    const cleanup = initializeSocket();
    return cleanup;
  }, [data, userId]);

  // 動畫變體
  const getAnimationVariants = (animationType: string) => {
    switch (animationType) {
      case 'slide':
        return {
          initial: { x: -100, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: 100, opacity: 0 }
        };
      case 'bounce':
        return {
          initial: { scale: 0, opacity: 0 },
          animate: { scale: 1, opacity: 1, transition: { type: 'spring', bounce: 0.5 } },
          exit: { scale: 0, opacity: 0 }
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  // 取得平台圖標
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return '📺';
      case 'twitch':
        return '💜';
      case 'manual':
      default:
        return '💬';
    }
  };

  // 格式化時間
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 取得容器位置樣式
  const getPositionStyle = (position: string) => {
    switch (position) {
      case 'top-left':
        return { top: '20px', left: '20px' };
      case 'top-right':
        return { top: '20px', right: '20px' };
      case 'bottom-right':
        return { bottom: '20px', right: '20px' };
      case 'bottom-left':
      default:
        return { bottom: '20px', left: '20px' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-2">⚠️</p>
          <p>{error || '找不到聊天室樣式'}</p>
        </div>
      </div>
    );
  }

  const { style } = data;
  const { config } = style;
  const animations = getAnimationVariants(config.animationType);

  return (
    <>
      <Helmet>
        <title>聊天室顯示 - {style.name}</title>
      </Helmet>

      <div 
        className="fixed"
        style={{
          ...getPositionStyle(config.position),
          fontFamily: config.fontFamily,
          fontSize: `${config.fontSize}px`,
          color: config.fontColor,
          width: 'auto',
          maxWidth: '400px',
          zIndex: 1000
        }}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              {...animations}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="mb-2"
              style={{
                backgroundColor: config.backgroundColor,
                borderRadius: `${config.borderRadius}px`,
                padding: `${config.padding}px`,
                wordWrap: 'break-word',
                position: 'relative'
              }}
            >
              {/* 新訊息標記 */}
              {message.isNew && (
                <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  New!
                </div>
              )}

              <div className="flex items-start space-x-2">
                {/* 平台圖標 */}
                {config.showPlatform && (
                  <span className="text-sm opacity-80">
                    {getPlatformIcon(message.platform)}
                  </span>
                )}

                <div className="flex-1 min-w-0">
                  {/* 使用者名稱 */}
                  <div className="flex items-center space-x-2 mb-1">
                    <span 
                      className="font-semibold truncate"
                      style={{ color: config.fontColor }}
                    >
                      {message.username}
                    </span>
                    
                    {/* 時間戳記 */}
                    {config.showTimestamp && (
                      <span 
                        className="text-xs opacity-60"
                        style={{ color: config.fontColor }}
                      >
                        {formatTimestamp(message.timestamp)}
                      </span>
                    )}

                    {/* 測試標記 */}
                    {message.isTest && (
                      <span className="text-xs bg-blue-500 text-white px-1 rounded">
                        TEST
                      </span>
                    )}
                  </div>

                  {/* 訊息內容 */}
                  <div 
                    className="break-words"
                    style={{ color: config.fontColor }}
                  >
                    {message.message}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 空狀態 */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            className="text-center p-4"
            style={{
              backgroundColor: config.backgroundColor,
              borderRadius: `${config.borderRadius}px`,
              color: config.fontColor
            }}
          >
            <p className="text-sm">等待聊天訊息...</p>
            <p className="text-xs mt-1 opacity-60">
              樣式：{style.name}
            </p>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default ChatDisplay;