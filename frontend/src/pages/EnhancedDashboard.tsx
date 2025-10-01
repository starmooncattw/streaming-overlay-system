import React, { useState } from 'react';
import styled from 'styled-components';
import { ChatStyle, ChatMessage } from '../types/style';
import StyleManager from '../components/style/StyleManager';
import TestMessageSender from '../components/test/TestMessageSender';
import useFirebaseAuth from '../hooks/useFirebaseAuth';
import toast from 'react-hot-toast';

const EnhancedDashboard: React.FC = () => {
  const { user } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'styles' | 'test' | 'obs'>('overview');
  const [selectedStyle, setSelectedStyle] = useState<ChatStyle | null>(null);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);

  const generateOBSUrl = (style: ChatStyle) => {
    if (!user || !style) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/overlay/${user.uid}?style=${style.id}`;
  };

  const handleStyleSelect = (style: ChatStyle) => {
    setSelectedStyle(style);
    toast.success(`已選擇樣式：${style.name}`);
  };

  const handleTestMessage = (message: ChatMessage) => {
    setRecentMessages(prev => [message, ...prev.slice(0, 9)]); // 保持最多10條訊息
  };


  if (!user) {
    return (
      <ErrorContainer>
        <h2>未登入</h2>
        <p>請先登入以使用控制台功能</p>
      </ErrorContainer>
    );
  }

  return (
    <DashboardContainer>
      {/* 頂部導航 */}
      <TopNav>
        <NavTitle>🎮 Streaming Overlay 控制台</NavTitle>
        <UserInfo>
          <Avatar src={user.photoURL || undefined}>
            {!user.photoURL && (user.displayName?.[0] || 'U')}
          </Avatar>
          <UserDetails>
            <UserName>{user.displayName || '用戶'}</UserName>
            <UserEmail>{user.email}</UserEmail>
          </UserDetails>
        </UserInfo>
      </TopNav>

      {/* 標籤導航 */}
      <TabNavigation>
        <TabButton
          $active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
        >
          📊 總覽
        </TabButton>
        <TabButton
          $active={activeTab === 'styles'}
          onClick={() => setActiveTab('styles')}
        >
          🎨 樣式管理
        </TabButton>
        <TabButton
          $active={activeTab === 'test'}
          onClick={() => setActiveTab('test')}
        >
          💬 測試訊息
        </TabButton>
        <TabButton
          $active={activeTab === 'obs'}
          onClick={() => setActiveTab('obs')}
        >
          📺 OBS 設定
        </TabButton>
      </TabNavigation>

      {/* 主要內容區域 */}
      <MainContent>
        {activeTab === 'overview' && (
          <OverviewSection>
            <SectionTitle>系統總覽</SectionTitle>
            <OverviewGrid>
              <OverviewCard>
                <CardIcon>🎨</CardIcon>
                <CardTitle>樣式管理</CardTitle>
                <CardDescription>
                  建立和管理聊天室顯示樣式，支援多種顯示模式和自訂設定
                </CardDescription>
                <CardButton onClick={() => setActiveTab('styles')}>
                  管理樣式
                </CardButton>
              </OverviewCard>

              <OverviewCard>
                <CardIcon>💬</CardIcon>
                <CardTitle>測試訊息</CardTitle>
                <CardDescription>
                  發送測試訊息到顯示頁面，預覽樣式效果
                </CardDescription>
                <CardButton onClick={() => setActiveTab('test')}>
                  發送測試
                </CardButton>
              </OverviewCard>

              <OverviewCard>
                <CardIcon>📺</CardIcon>
                <CardTitle>OBS 整合</CardTitle>
                <CardDescription>
                  獲取 OBS Browser Source 網址，設定透明背景顯示
                </CardDescription>
                <CardButton onClick={() => setActiveTab('obs')}>
                  OBS 設定
                </CardButton>
              </OverviewCard>
            </OverviewGrid>

            {/* 最近訊息 */}
            {recentMessages.length > 0 && (
              <RecentMessagesSection>
                <SectionTitle>最近測試訊息</SectionTitle>
                <MessagesList>
                  {recentMessages.map((msg) => (
                    <MessageItem key={msg.id}>
                      <MessageUser platform={msg.platform}>
                        {msg.username}
                      </MessageUser>
                      <MessageText>{msg.message}</MessageText>
                      <MessageTime>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </MessageTime>
                    </MessageItem>
                  ))}
                </MessagesList>
              </RecentMessagesSection>
            )}
          </OverviewSection>
        )}

        {activeTab === 'styles' && (
          <StyleManager user={user} onStyleSelect={handleStyleSelect} />
        )}

        {activeTab === 'test' && (
          <TestMessageSender
            userId={user.uid}
            onSendMessage={handleTestMessage}
            overlayUrl={selectedStyle ? generateOBSUrl(selectedStyle) : undefined}
          />
        )}

        {activeTab === 'obs' && (
          <OBSSection>
            <SectionTitle>📺 OBS 整合設定</SectionTitle>
            
            {selectedStyle ? (
              <OBSContent>
                <OBSUrlSection>
                  <h4>當前選擇的樣式：{selectedStyle.name}</h4>
                  <OBSUrlContainer>
                    <OBSUrl>{generateOBSUrl(selectedStyle)}</OBSUrl>
                    <CopyButton
                      onClick={() => {
                        navigator.clipboard.writeText(generateOBSUrl(selectedStyle));
                        toast.success('OBS 網址已複製到剪貼簿');
                      }}
                    >
                      複製網址
                    </CopyButton>
                    <PreviewButton
                      onClick={() => window.open(generateOBSUrl(selectedStyle), '_blank')}
                    >
                      預覽
                    </PreviewButton>
                  </OBSUrlContainer>
                </OBSUrlSection>

                <OBSInstructions>
                  <h4>📋 OBS 設定步驟：</h4>
                  <InstructionsList>
                    <li>在 OBS Studio 中點擊「來源」區域的「+」按鈕</li>
                    <li>選擇「瀏覽器來源」並建立新的來源</li>
                    <li>將上方的網址貼到「URL」欄位中</li>
                    <li>設定寬度為 <code>1920</code>，高度為 <code>1080</code></li>
                    <li>勾選「關閉來源時關閉瀏覽器」選項</li>
                    <li>點擊「確定」完成設定</li>
                    <li>調整來源位置和大小以符合您的需求</li>
                  </InstructionsList>
                </OBSInstructions>

                <OBSTips>
                  <h4>💡 使用技巧：</h4>
                  <TipsList>
                    <li><strong>透明背景：</strong> 顯示頁面已設定透明背景，可直接疊加在遊戲畫面上</li>
                    <li><strong>即時更新：</strong> 修改樣式後會即時反映到 OBS 中</li>
                    <li><strong>多樣式：</strong> 可以建立多個樣式並切換使用</li>
                    <li><strong>測試功能：</strong> 使用測試訊息功能預覽效果</li>
                  </TipsList>
                </OBSTips>
              </OBSContent>
            ) : (
              <NoStyleSelected>
                <h4>請先選擇一個樣式</h4>
                <p>前往「樣式管理」頁面選擇或建立一個樣式，然後回到此頁面獲取 OBS 網址。</p>
                <SelectStyleButton onClick={() => setActiveTab('styles')}>
                  選擇樣式
                </SelectStyleButton>
              </NoStyleSelected>
            )}
          </OBSSection>
        )}
      </MainContent>
    </DashboardContainer>
  );
};

// 樣式組件
const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  padding: 2rem;
`;

const ErrorContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  color: white;
  text-align: center;
  
  h2 {
    margin-bottom: 1rem;
    color: #ff6b6b;
  }
`;

const TopNav = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(20px);
`;

const NavTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Avatar = styled.div<{ src?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.src ? `url(${props.src})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.span`
  color: #ffffff;
  font-weight: 500;
  font-size: 1rem;
`;

const UserEmail = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
`;

const TabNavigation = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 0.5rem;
`;

const TabButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ?
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
    'transparent'
  };
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: ${props => props.$active ?
      'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)' :
      'rgba(255, 255, 255, 0.1)'
    };
  }
`;

const MainContent = styled.div`
  /* 主要內容區域樣式 */
`;

const OverviewSection = styled.div`
  /* 總覽區域樣式 */
`;

const SectionTitle = styled.h2`
  color: white;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const OverviewCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(102, 126, 234, 0.3);
  }
`;

const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const CardTitle = styled.h3`
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const CardDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
`;

const CardButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
`;

const RecentMessagesSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(20px);
`;

const MessagesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MessageItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
`;

const MessageUser = styled.span<{ platform?: string }>`
  font-weight: bold;
  color: ${props => 
    props.platform === 'youtube' ? '#ff0000' :
    props.platform === 'twitch' ? '#9146ff' :
    '#00ff00'
  };
  min-width: 100px;
`;

const MessageText = styled.span`
  color: white;
  flex: 1;
`;

const MessageTime = styled.span`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
`;

const OBSSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(20px);
`;

const OBSContent = styled.div`
  /* OBS 內容樣式 */
`;

const OBSUrlSection = styled.div`
  margin-bottom: 2rem;
  
  h4 {
    color: white;
    margin-bottom: 1rem;
  }
`;

const OBSUrlContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const OBSUrl = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1rem;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  word-break: break-all;
`;

const CopyButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 1rem 1.5rem;
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

const PreviewButton = styled.button`
  background: #667eea;
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: #5a6fd8;
    transform: translateY(-2px);
  }
`;

const OBSInstructions = styled.div`
  margin-bottom: 2rem;
  
  h4 {
    color: white;
    margin-bottom: 1rem;
  }
`;

const InstructionsList = styled.ol`
  color: rgba(255, 255, 255, 0.8);
  padding-left: 1.5rem;
  line-height: 1.6;
  
  li {
    margin-bottom: 0.5rem;
  }
  
  code {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    color: #00ff00;
  }
`;

const OBSTips = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  
  h4 {
    color: white;
    margin-bottom: 1rem;
  }
`;

const TipsList = styled.ul`
  color: rgba(255, 255, 255, 0.8);
  padding-left: 1.5rem;
  line-height: 1.6;
  
  li {
    margin-bottom: 0.5rem;
    
    strong {
      color: #667eea;
    }
  }
`;

const NoStyleSelected = styled.div`
  text-align: center;
  padding: 3rem;
  
  h4 {
    color: white;
    margin-bottom: 1rem;
  }
  
  p {
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 2rem;
    line-height: 1.6;
  }
`;

const SelectStyleButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
`;

export default EnhancedDashboard;
