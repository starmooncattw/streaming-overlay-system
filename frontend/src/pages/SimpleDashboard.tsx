import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { User } from 'firebase/auth';
import { googleAuthService } from '../services/googleAuthService';
import toast from 'react-hot-toast';

// 樣式組件
const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
`;

const DashboardCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
`;

const Title = styled.h1`
  color: #333;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Avatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid #667eea;
`;

const UserName = styled.span`
  font-weight: 600;
  color: #333;
`;

const LogoutButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;

  &:hover {
    background: #c82333;
  }
`;

const WelcomeSection = styled.div`
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea20, #764ba220);
  border-radius: 16px;
  margin-bottom: 2rem;
`;

const WelcomeTitle = styled.h2`
  color: #333;
  margin-bottom: 1rem;
`;

const WelcomeText = styled.p`
  color: #666;
  font-size: 1.1rem;
  line-height: 1.6;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const FeatureCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const FeatureIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  color: #333;
  margin-bottom: 0.5rem;
`;

const FeatureDescription = styled.p`
  color: #666;
  font-size: 0.9rem;
`;

const SimpleDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = googleAuthService.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      if (!firebaseUser) {
        // 未登入，重定向到登入頁
        window.location.href = '/login';
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await googleAuthService.signOut();
      toast.success('已成功登出');
      window.location.href = '/login';
    } catch (error: any) {
      console.error('登出失敗:', error);
      toast.error('登出失敗，請重試');
    }
  };

  if (loading) {
    return (
      <DashboardContainer>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              border: '4px solid rgba(255,255,255,0.3)',
              borderTop: '4px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p>載入中...</p>
          </div>
        </div>
      </DashboardContainer>
    );
  }

  if (!user) {
    return null; // 會被重定向到登入頁
  }

  return (
    <DashboardContainer>
      <DashboardCard>
        <Header>
          <Title>🎮 Streaming Overlay 控制台</Title>
          <UserInfo>
            {user.photoURL && (
              <Avatar src={user.photoURL} alt="用戶頭像" />
            )}
            <UserName>{user.displayName || '直播主'}</UserName>
            <LogoutButton onClick={handleLogout}>
              登出
            </LogoutButton>
          </UserInfo>
        </Header>

        <WelcomeSection>
          <WelcomeTitle>🎉 歡迎使用 Streaming Overlay 系統！</WelcomeTitle>
          <WelcomeText>
            您已成功登入系統。這是您的直播覆蓋層管理控制台，
            您可以在這裡管理直播設定、自定義覆蓋層樣式，以及監控直播狀態。
          </WelcomeText>
        </WelcomeSection>

        <FeatureGrid>
          <FeatureCard>
            <FeatureIcon>🎨</FeatureIcon>
            <FeatureTitle>覆蓋層設計</FeatureTitle>
            <FeatureDescription>
              自定義聊天室顯示樣式、字體、顏色和動畫效果
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>💬</FeatureIcon>
            <FeatureTitle>聊天室管理</FeatureTitle>
            <FeatureDescription>
              即時顯示觀眾留言，支援多平台聊天室整合
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>💰</FeatureIcon>
            <FeatureTitle>斗內提醒</FeatureTitle>
            <FeatureDescription>
              即時顯示觀眾斗內，自定義感謝動畫和音效
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>📊</FeatureIcon>
            <FeatureTitle>數據統計</FeatureTitle>
            <FeatureDescription>
              追蹤直播數據、觀眾互動和收益統計
            </FeatureDescription>
          </FeatureCard>
        </FeatureGrid>
      </DashboardCard>
    </DashboardContainer>
  );
};

export default SimpleDashboard;
