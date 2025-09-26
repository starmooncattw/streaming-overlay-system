import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';

import { googleAuthService } from '../services/googleAuthService';
import LoadingSpinner from '../components/common/LoadingSpinner';

// 樣式組件
const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
`;

const LoginCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
`;

const Logo = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  color: #333;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1rem;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const GoogleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 16px 24px;
  background: #fff;
  border: 2px solid #ddd;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #4285f4;
    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.2);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const GoogleIcon = styled.div`
  width: 24px;
  height: 24px;
  background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIyLjU2IDEyLjI1QzIyLjU2IDExLjQ3IDIyLjQ5IDEwLjcyIDIyLjM2IDEwSDEyVjE0LjI2SDE3LjkyQzE3LjY2IDE1LjYgMTYuOTIgMTYuNzQgMTUuODQgMTcuNVYyMC4yNUgxOS4yOEMyMS4zNiAxOC4yNSAyMi41NiAxNS41MyAyMi41NiAxMi4yNVoiIGZpbGw9IiM0Mjg1RjQiLz4KPHBhdGggZD0iTTEyIDI0QzE1LjI0IDI0IDE3LjkyIDIyLjkyIDE5LjI4IDIwLjI1TDE1Ljg0IDE3LjVDMTQuNzYgMTguMjUgMTMuNDYgMTguNzUgMTIgMTguNzVDOC44NyAxOC43NSA2LjIyIDE2LjcyIDUuMjcgMTMuOTVIMUwxLjY0IDE2LjcyQzMuMDEgMTkuNDkgNy4yNiAyNCAxMiAyNFoiIGZpbGw9IiMzNEE4NTMiLz4KPHBhdGggZD0iTTUuMjcgMTMuOTVDNS4wMiAxMy4yNSA0Ljg4IDEyLjUgNC44OCAxMS43NUM0Ljg4IDExIDUuMDIgMTAuMjUgNS4yNyA5LjU1VjYuNzhIMUMwLjM2IDguMDggMCA5Ljg1IDAgMTEuNzVDMCAxMy42NSAwLjM2IDE1LjQyIDEgMTYuNzJMNS4yNyAxMy45NVoiIGZpbGw9IiNGQkJDMDUiLz4KPHBhdGggZD0iTTEyIDUuMjVDMTMuNjIgNS4yNSAxNS4wNiA1LjgxIDE2LjIxIDYuOTFMMTkuMjggMy44NEMxNy45MiAyLjU5IDE1LjI0IDEuNSAxMiAxLjVDNy4yNiAxLjUgMy4wMSA1Ljk5IDEuNjQgOC43Nkw1LjI3IDExLjUzQzYuMjIgOC43NyA4Ljg3IDYuNzUgMTIgNi43NVoiIGZpbGw9IiNFQTQzMzUiLz4KPC9zdmc+') no-repeat center;
  background-size: contain;
`;

const FeatureList = styled.div`
  margin-top: 2rem;
  text-align: left;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #666;
  font-size: 0.9rem;
`;

const CheckIcon = styled.span`
  color: #4285f4;
  font-weight: bold;
`;

const GoogleLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = React.useState(false);

  // 檢查是否已登入
  useEffect(() => {
    const unsubscribe = googleAuthService.onAuthStateChanged((user) => {
      if (user) {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate, location]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { user, profile } = await googleAuthService.signInWithGoogle();
      
      toast.success(`歡迎回來，${profile.displayName}！`);
      
      // 重定向到儀表板
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      
    } catch (error: any) {
      console.error('Google 登入失敗:', error);
      toast.error(error.message || '登入失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>🎥</Logo>
        <Title>Streaming Overlay</Title>
        <Subtitle>
          專為直播主設計的覆蓋層管理系統
          <br />
          使用 Google 帳號快速登入
        </Subtitle>

        <GoogleButton 
          onClick={handleGoogleLogin} 
          disabled={loading}
        >
          {loading ? (
            <LoadingSpinner size="small" />
          ) : (
            <>
              <GoogleIcon />
              使用 Google 登入
            </>
          )}
        </GoogleButton>

        <FeatureList>
          <FeatureItem>
            <CheckIcon>✓</CheckIcon>
            自定義直播覆蓋層
          </FeatureItem>
          <FeatureItem>
            <CheckIcon>✓</CheckIcon>
            即時聊天室管理
          </FeatureItem>
          <FeatureItem>
            <CheckIcon>✓</CheckIcon>
            捐款提醒系統
          </FeatureItem>
          <FeatureItem>
            <CheckIcon>✓</CheckIcon>
            多平台整合支援
          </FeatureItem>
        </FeatureList>
      </LoginCard>
    </LoginContainer>
  );
};

export default GoogleLogin;
