import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { ChatStyle, ChatMessage } from '../types/style';
import { styleService } from '../services/styleService';
import { messageService } from '../services/messageService';

const OverlayView: React.FC = () => {
  const { streamerId } = useParams<{ streamerId: string }>();
  const [searchParams] = useSearchParams();
  const styleId = searchParams.get('style');
  
  const [style, setStyle] = useState<ChatStyle | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStyleAsync = async () => {
      if (!streamerId) {
        setLoading(false);
        return;
      }

      try {
        let styleData: ChatStyle | null = null;

        // 如果有指定樣式 ID，優先使用指定的樣式
        if (styleId) {
          styleData = await styleService.getStyleById(styleId);
        }

        // 如果沒有指定樣式或載入失敗，使用預設樣式
        if (!styleData) {
          styleData = await styleService.getDefaultStyle(streamerId);
        }

        setStyle(styleData);
      } catch (error) {
        console.error('載入樣式失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStyleAsync();

    // 如果有 streamerId，訂閱即時訊息
    if (streamerId) {
      const unsubscribe = messageService.subscribeToMessages(streamerId, (newMessages) => {
        // 只保留最近 10 條訊息
        setMessages(newMessages.slice(-10));
      });

      return () => unsubscribe();
    }
  }, [styleId, streamerId]);

  const generateMessageStyle = (style: ChatStyle) => {
    return {
      fontFamily: style.font.family,
      fontSize: `${style.font.size}px`,
      fontWeight: style.font.weight,
      color: style.font.color,
      backgroundColor: `${style.background.color}${Math.round(style.background.opacity * 255).toString(16).padStart(2, '0')}`,
      padding: `${style.layout.padding}px`,
      margin: `${style.layout.margin}px`,
      borderRadius: `${style.layout.borderRadius}px`,
      maxWidth: style.layout.maxWidth ? `${style.layout.maxWidth}px` : 'none',
      textAlign: style.layout.alignment as any,
      backdropFilter: style.background.blur > 0 ? `blur(${style.background.blur}px)` : 'none',
      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
      animation: `${style.animation?.entrance || 'fade'} ${style.animation?.duration || 300}ms ease-out`,
      animationDelay: `${style.animation?.delay || 0}ms`
    };
  };

  if (loading) {
    return (
      <OBSContainer>
        <LoadingMessage>載入中...</LoadingMessage>
      </OBSContainer>
    );
  }

  if (!style) {
    return (
      <OBSContainer>
        <ErrorMessage>找不到指定的樣式</ErrorMessage>
      </OBSContainer>
    );
  }

  return (
    <OBSContainer>
      <ChatContainer className={`chat-container ${style.displayMode}`}>
        {messages.map((message) => (
          <ChatMessageElement
            key={message.id}
            style={generateMessageStyle(style)}
          >
            <Username platform={message.platform}>
              {message.username}:
            </Username>
            <MessageText>
              {message.message}
            </MessageText>
          </ChatMessageElement>
        ))}
      </ChatContainer>
      
      {/* 注入動態 CSS */}
      <style>
        {`
          @keyframes fade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slide {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          
          @keyframes bounce {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.05); }
            70% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </OBSContainer>
  );
};

// 樣式組件
const OBSContainer = styled.div`
  min-height: 100vh;
  background: transparent !important;
  padding: 1rem;
  overflow: hidden;
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  &.horizontal {
    align-items: flex-start;
  }
  
  &.dialog {
    align-items: flex-start;
    max-width: 600px;
  }
  
  &.danmaku {
    position: fixed;
    top: 20%;
    left: 0;
    right: 0;
    align-items: center;
  }
  
  &.notebook {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem;
    max-width: 700px;
  }
`;

const ChatMessageElement = styled.div`
  display: flex;
  align-items: baseline;
  word-wrap: break-word;
  line-height: 1.4;
`;

const Username = styled.span<{ platform?: string }>`
  font-weight: bold;
  margin-right: 0.5rem;
  flex-shrink: 0;
  
  ${props => props.platform === 'youtube' && `
    color: #ff0000;
  `}
  
  ${props => props.platform === 'twitch' && `
    color: #9146ff;
  `}
  
  ${props => props.platform === 'test' && `
    color: #00ff00;
  `}
`;

const MessageText = styled.span`
  word-break: break-word;
`;

const LoadingMessage = styled.div`
  color: white;
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
`;

export default OverlayView;
