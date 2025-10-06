import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { RootState } from '../store/store';
import useFirebaseAuth from '../hooks/useFirebaseAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

// 樣式組件
const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  padding: 2rem;
`;

const DashboardHeader = styled.div`
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

const WelcomeSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const WelcomeTitle = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const WelcomeSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
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

const UserRole = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  text-transform: capitalize;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`;

const DashboardCard = styled.div`
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  backdrop-filter: blur(20px);
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
`;

const EmailVerificationBanner = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BannerText = styled.div`
  color: #ffc107;
  font-size: 0.9rem;
`;

const BannerButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #ffc107;
  border-radius: 6px;
  background: transparent;
  color: #ffc107;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 193, 7, 0.1);
  }
`;

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { user, profile, initializing, isAuthenticated, isEmailVerified } = useFirebaseAuth();
  const { loading } = useSelector((state: RootState) => state.firebaseAuth);

  // 如果正在初始化，顯示載入畫面
  if (initializing) {
    return <LoadingSpinner fullScreen text="載入中..." />;
  }

  // 如果未認證，這應該由 ProtectedRoute 處理，但作為備用
  if (!isAuthenticated || !user || !profile) {
    return <LoadingSpinner fullScreen text="驗證中..." />;
  }

  // 獲取用戶名稱的首字母作為頭像
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // 角色對應的功能卡片
  const getFeatureCards = () => {
    const commonCards = [
      {
        icon: '👤',
        title: '個人資料',
        description: '管理您的個人資料、頭像和偏好設定',
        action: '編輯資料',
        onClick: () => console.log('編輯個人資料')
      }
    ];

    const streamerCards = [
      {
        icon: '🎥',
        title: '直播管理',
        description: '開始直播、管理直播設定和查看直播統計',
        action: '管理直播',
        onClick: () => console.log('管理直播')
      },
      {
        icon: '🎨',
        title: '疊加層編輯器',
        description: '自訂您的直播疊加層、警報和小工具',
        action: '編輯疊加層',
        onClick: () => console.log('編輯疊加層')
      },
      {
        icon: '💰',
        title: '捐款管理',
        description: '查看捐款記錄、設定捐款目標和感謝訊息',
        action: '管理捐款',
        onClick: () => console.log('管理捐款')
      }
    ];

    const adminCards = [
      {
        icon: '⚙️',
        title: '系統管理',
        description: '管理用戶、系統設定和監控系統狀態',
        action: '系統設定',
        onClick: () => console.log('系統管理')
      },
      {
        icon: '📊',
        title: '分析報告',
        description: '查看平台統計、用戶分析和收益報告',
        action: '查看報告',
        onClick: () => console.log('查看分析')
      }
    ];

    switch (profile.role) {
      case 'admin':
        return [...commonCards, ...streamerCards, ...adminCards];
      case 'streamer':
        return [...commonCards, ...streamerCards];
      default:
        return commonCards;
    }
  };

  // 統計數據 (模擬數據)
  const getStats = () => {
    const commonStats = [
      { label: '帳號天數', value: '30' },
      { label: '登入次數', value: '45' }
    ];

    const streamerStats = [
      { label: '總直播時數', value: '120' },
      { label: '觀眾總數', value: '1.2K' },
      { label: '總捐款', value: '$500' }
    ];

    const adminStats = [
      { label: '總用戶數', value: '2.5K' },
      { label: '活躍直播', value: '15' },
      { label: '系統狀態', value: '正常' }
    ];

    switch (profile.role) {
      case 'admin':
        return [...commonStats, ...adminStats];
      case 'streamer':
        return [...commonStats, ...streamerStats];
      default:
        return commonStats;
    }
  };

  return (
    <DashboardContainer>
      {/* 郵件驗證提醒 */}
      {!isEmailVerified && (
        <EmailVerificationBanner>
          <BannerText>
            ⚠️ 請驗證您的電子郵件地址以使用完整功能
          </BannerText>
          <BannerButton onClick={() => console.log('重新發送驗證郵件')}>
            重新發送
          </BannerButton>
        </EmailVerificationBanner>
      )}

      {/* 頁面標題 */}
      <DashboardHeader>
        <WelcomeSection>
          <WelcomeTitle>歡迎回來，{profile.displayName}！</WelcomeTitle>
          <WelcomeSubtitle>
            {profile.role === 'admin' && '管理您的直播平台'}
            {profile.role === 'streamer' && '準備開始您的直播'}
            {profile.role === 'viewer' && '探索精彩的直播內容'}
          </WelcomeSubtitle>
        </WelcomeSection>
        
        <UserInfo>
          <Avatar src={profile.avatar}>
            {!profile.avatar && getInitials(profile.displayName)}
          </Avatar>
          <UserDetails>
            <UserName>{profile.displayName}</UserName>
            <UserRole>{profile.role}</UserRole>
          </UserDetails>
        </UserInfo>
      </DashboardHeader>

      {/* 統計數據 */}
      <StatsSection>
        {getStats().map((stat, index) => (
          <StatCard key={index}>
            <StatValue>{stat.value}</StatValue>
            <StatLabel>{stat.label}</StatLabel>
          </StatCard>
        ))}
      </StatsSection>

      {/* 功能卡片 */}
      <DashboardGrid>
        {getFeatureCards().map((card, index) => (
          <DashboardCard key={index}>
            <CardIcon>{card.icon}</CardIcon>
            <CardTitle>{card.title}</CardTitle>
            <CardDescription>{card.description}</CardDescription>
            <CardButton onClick={card.onClick} disabled={loading}>
              {card.action}
            </CardButton>
          </DashboardCard>
        ))}
      </DashboardGrid>
    </DashboardContainer>
  );
};

export default Dashboard;
