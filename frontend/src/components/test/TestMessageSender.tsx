import React, { useState } from 'react';
import styled from 'styled-components';
import { ChatMessage } from '../../types/style';
import { messageService } from '../../services/messageService';
import toast from 'react-hot-toast';

interface TestMessageSenderProps {
  userId: string;
  onSendMessage?: (message: ChatMessage) => void;
  overlayUrl?: string;
}

const TestMessageSender: React.FC<TestMessageSenderProps> = ({
  userId,
  onSendMessage,
  overlayUrl
}) => {
  const [username, setUsername] = useState('測試用戶');
  const [message, setMessage] = useState('');
  const [platform, setPlatform] = useState<'youtube' | 'twitch' | 'test'>('test');

  const predefinedMessages = [
    '哈囉大家好！',
    '666666',
    '主播加油！',
    '這個遊戲好好玩',
    '笑死我了 XD',
    '求攻略',
    '第一次看直播',
    '訂閱了！',
    '什麼時候下播？',
    '音量可以大聲一點嗎？'
  ];

  const predefinedUsernames = [
    '遊戲高手', '路人甲', '夜貓子', '學生黨', '上班族', 
    '遊戲新手', '老粉絲', '路過的', '好奇寶寶', '支持者'
  ];

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('請輸入訊息內容');
      return;
    }

    const testMessage: ChatMessage = {
      id: Date.now().toString(),
      username: username || '匿名用戶',
      message: message.trim(),
      timestamp: new Date(),
      platform
    };

    try {
      // 發送到 Firebase
      await messageService.sendMessage(userId, testMessage);

      // 同時觸發本地回調
      onSendMessage?.(testMessage);

      toast.success('測試訊息已發送！');
      setMessage(''); // 清空訊息框
    } catch (error) {
      console.error('發送訊息失敗:', error);
      toast.error('發送訊息失敗，請稍後再試');
    }
  };

  const handleQuickMessage = (msg: string) => {
    setMessage(msg);
  };

  const handleRandomMessage = async () => {
    const randomMsg = predefinedMessages[Math.floor(Math.random() * predefinedMessages.length)];
    const randomUser = predefinedUsernames[Math.floor(Math.random() * predefinedUsernames.length)];
    const randomPlatform = Math.random() > 0.5 ? 'youtube' : 'twitch';

    setUsername(randomUser);
    setMessage(randomMsg);

    // 自動發送
    setTimeout(async () => {
      const testMessage: ChatMessage = {
        id: Date.now().toString(),
        username: randomUser,
        message: randomMsg,
        timestamp: new Date(),
        platform: randomPlatform
      };

      try {
        await messageService.sendMessage(userId, testMessage);
        onSendMessage?.(testMessage);
        toast.success('隨機測試訊息已發送！');
      } catch (error) {
        console.error('發送訊息失敗:', error);
        toast.error('發送訊息失敗');
      }
    }, 100);
  };

  const copyOBSUrl = () => {
    if (overlayUrl) {
      navigator.clipboard.writeText(overlayUrl);
      toast.success('OBS 網址已複製到剪貼簿');
    } else {
      toast.error('請先選擇一個樣式');
    }
  };

  return (
    <Container>
      <Header>
        <Title>💬 測試訊息發送器</Title>
        <Description>發送測試訊息到 OBS 顯示頁面</Description>
      </Header>

      <FormSection>
        <InputGroup>
          <Label>用戶名稱</Label>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="輸入用戶名稱"
          />
        </InputGroup>

        <InputGroup>
          <Label>平台</Label>
          <Select value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
            <option value="test">測試</option>
            <option value="youtube">YouTube</option>
            <option value="twitch">Twitch</option>
          </Select>
        </InputGroup>

        <InputGroup>
          <Label>訊息內容</Label>
          <MessageInput
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="輸入測試訊息..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
        </InputGroup>

        <ButtonGroup>
          <SendButton onClick={handleSendMessage} primary>
            發送訊息
          </SendButton>
          <ActionButton onClick={handleRandomMessage}>
            隨機訊息
          </ActionButton>
        </ButtonGroup>
      </FormSection>

      <QuickMessagesSection>
        <SectionTitle>快速訊息</SectionTitle>
        <QuickMessageGrid>
          {predefinedMessages.map((msg, index) => (
            <QuickMessageButton 
              key={index} 
              onClick={() => handleQuickMessage(msg)}
            >
              {msg}
            </QuickMessageButton>
          ))}
        </QuickMessageGrid>
      </QuickMessagesSection>

      {overlayUrl && (
        <OBSSection>
          <SectionTitle>OBS 設定</SectionTitle>
          <OBSUrlContainer>
            <OBSUrl>{overlayUrl}</OBSUrl>
            <CopyButton onClick={copyOBSUrl}>
              複製網址
            </CopyButton>
          </OBSUrlContainer>
          <OBSInstructions>
            <h4>📺 OBS 設定步驟：</h4>
            <ol>
              <li>在 OBS 中添加「瀏覽器來源」</li>
              <li>將上方網址貼到 URL 欄位</li>
              <li>設定寬度: 1920，高度: 1080</li>
              <li>勾選「關閉來源時關閉瀏覽器」</li>
              <li>點擊確定完成設定</li>
            </ol>
          </OBSInstructions>
        </OBSSection>
      )}
    </Container>
  );
};

// 樣式組件
const Container = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(20px);
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h3`
  color: white;
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
`;

const Description = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 0.9rem;
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  color: white;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.15);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;

  option {
    background: #1a1a2e;
    color: white;
  }

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const MessageInput = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  resize: vertical;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.15);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const SendButton = styled.button<{ primary?: boolean }>`
  background: ${props => props.primary ? 
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
    'rgba(255, 255, 255, 0.1)'
  };
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    background: ${props => props.primary ? 
      'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)' : 
      'rgba(255, 255, 255, 0.2)'
    };
  }
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
`;

const QuickMessagesSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h4`
  color: white;
  margin: 0 0 1rem 0;
  font-size: 1rem;
`;

const QuickMessageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
`;

const QuickMessageButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    transform: translateY(-1px);
  }
`;

const OBSSection = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 2rem;
`;

const OBSUrlContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
`;

const OBSUrl = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  word-break: break-all;
`;

const CopyButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: #218838;
    transform: translateY(-2px);
  }
`;

const OBSInstructions = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1rem;
  
  h4 {
    color: white;
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
  }
  
  ol {
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    padding-left: 1.5rem;
    font-size: 0.8rem;
    
    li {
      margin-bottom: 0.25rem;
    }
  }
`;

export default TestMessageSender;
