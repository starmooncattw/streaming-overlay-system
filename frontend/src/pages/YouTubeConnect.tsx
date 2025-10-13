import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { youtubeService } from '../services/youtubeService';
import useFirebaseAuth from '../hooks/useFirebaseAuth';
import toast from 'react-hot-toast';

const YouTubeConnect: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useFirebaseAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [processedCode, setProcessedCode] = useState<string | null>(null);

  useEffect(() => {
    // 檢查 OAuth 回調
    const code = searchParams.get('code');
    if (code && code !== processedCode) {
      setProcessedCode(code);
      handleOAuthCallback(code);
    } else if (!code) {
      setIsAuthenticated(youtubeService.isAuthenticated());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleOAuthCallback = async (code: string) => {
    setIsConnecting(true);
    try {
      await youtubeService.exchangeCode(code);
      toast.success('YouTube 認證成功！');
      setIsAuthenticated(true);
      // 清除 URL 參數
      navigate('/youtube/connect', { replace: true });
    } catch (error) {
      console.error('認證失敗:', error);
      toast.error('YouTube 認證失敗');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const authUrl = await youtubeService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('獲取授權 URL 失敗:', error);
      toast.error('連接 YouTube 失敗');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    youtubeService.clearCredentials();
    setIsAuthenticated(false);
    toast.success('已中斷 YouTube 連接');
  };

  const handleGoToControl = () => {
    navigate('/youtube/control');
  };

  if (!user) {
    return (
      <Container>
        <Card>
          <h2>請先登入</h2>
          <p>您需要先登入才能連接 YouTube</p>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <Icon>📺</Icon>
        <Title>YouTube 直播整合</Title>

        {isConnecting ? (
          <Status>
            <Spinner />
            <p>連接中...</p>
          </Status>
        ) : isAuthenticated ? (
          <Connected>
            <SuccessIcon>✓</SuccessIcon>
            <p>已連接到 YouTube</p>

            <ButtonGroup>
              <PrimaryButton onClick={handleGoToControl}>
                進入控制台
              </PrimaryButton>
              <SecondaryButton onClick={handleDisconnect}>
                中斷連接
              </SecondaryButton>
            </ButtonGroup>
          </Connected>
        ) : (
          <NotConnected>
            <InfoBox>
              <h3>連接 YouTube 帳號</h3>
              <ul>
                <li>搜尋進行中的直播</li>
                <li>即時擷取聊天室訊息</li>
                <li>自動同步到 OBS 顯示</li>
              </ul>
            </InfoBox>

            <ConnectButton onClick={handleConnect} disabled={isConnecting}>
              <YouTubeIcon>▶</YouTubeIcon>
              連接 YouTube
            </ConnectButton>

            <Notice>
              點擊後將導向 Google 授權頁面
            </Notice>
          </NotConnected>
        )}
      </Card>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
  backdrop-filter: blur(20px);
`;

const Icon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  color: white;
  font-size: 1.8rem;
  margin-bottom: 2rem;
`;

const Status = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
  color: rgba(255, 255, 255, 0.8);
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Connected = styled.div`
  padding: 2rem 0;
`;

const SuccessIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const PrimaryButton = styled.button`
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const SecondaryButton = styled.button`
  flex: 1;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const NotConnected = styled.div`
  padding: 2rem 0;
`;

const InfoBox = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;

  h3 {
    color: white;
    margin-bottom: 1rem;
  }

  ul {
    color: rgba(255, 255, 255, 0.8);
    list-style: none;
    padding: 0;

    li {
      padding: 0.5rem 0;
      padding-left: 1.5rem;
      position: relative;

      &:before {
        content: '✓';
        position: absolute;
        left: 0;
        color: #10b981;
      }
    }
  }
`;

const ConnectButton = styled.button`
  width: 100%;
  padding: 1.2rem;
  border: none;
  border-radius: 10px;
  background: #ff0000;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: #cc0000;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const YouTubeIcon = styled.span`
  font-size: 1.5rem;
`;

const Notice = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin-top: 1rem;
`;

export default YouTubeConnect;
