import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { youtubeService, LiveStream } from '../services/youtubeService';
import useFirebaseAuth from '../hooks/useFirebaseAuth';
import toast from 'react-hot-toast';

const YouTubeControl: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useFirebaseAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [activeCrawler, setActiveCrawler] = useState<{
    streamerId: string;
    videoId: string;
    stream: LiveStream;
  } | null>(null);
  const [crawlerStats, setCrawlerStats] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/youtube/connect');
      return;
    }

    if (!youtubeService.isAuthenticated()) {
      navigate('/youtube/connect');
      return;
    }

    // 檢查是否有活動的爬蟲
    checkActiveCrawler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const checkActiveCrawler = async () => {
    if (!user) return;

    try {
      const stats = await youtubeService.getCrawlerStatus(user.uid);
      if (stats) {
        setCrawlerStats(stats);
      }
    } catch (error) {
      console.error('檢查爬蟲狀態失敗:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('請輸入搜尋關鍵字');
      return;
    }

    setIsSearching(true);
    try {
      const results = await youtubeService.searchLiveStreams(searchQuery);
      setStreams(results);

      if (results.length === 0) {
        toast('沒有找到進行中的直播');
      } else {
        toast.success(`找到 ${results.length} 個直播`);
      }
    } catch (error) {
      console.error('搜尋失敗:', error);
      toast.error('搜尋失敗');
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartCrawler = async (stream: LiveStream) => {
    if (!user) return;

    try {
      await youtubeService.startCrawler(user.uid, stream.id);
      setActiveCrawler({
        streamerId: user.uid,
        videoId: stream.id,
        stream
      });
      toast.success('開始爬取聊天室訊息');

      // 開始定期更新狀態
      startStatsPolling();
    } catch (error) {
      console.error('啟動爬蟲失敗:', error);
      toast.error('啟動爬蟲失敗');
    }
  };

  const handleStopCrawler = async () => {
    if (!user) return;

    try {
      await youtubeService.stopCrawler(user.uid);
      setActiveCrawler(null);
      setCrawlerStats(null);
      toast.success('已停止爬蟲');
    } catch (error) {
      console.error('停止爬蟲失敗:', error);
      toast.error('停止爬蟲失敗');
    }
  };

  const startStatsPolling = () => {
    const interval = setInterval(async () => {
      if (!user) return;

      try {
        const stats = await youtubeService.getCrawlerStatus(user.uid);
        if (stats) {
          setCrawlerStats(stats);
        } else {
          clearInterval(interval);
          setActiveCrawler(null);
        }
      } catch (error) {
        console.error('獲取狀態失敗:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/dashboard')}>
          ← 返回
        </BackButton>
        <Title>YouTube 直播控制台</Title>
      </Header>

      {activeCrawler && (
        <ActiveCrawlerCard>
          <CardHeader>
            <StatusDot />
            <h3>正在爬取</h3>
          </CardHeader>

          <StreamInfo>
            <Thumbnail src={activeCrawler.stream.thumbnailUrl} alt={activeCrawler.stream.title} />
            <StreamDetails>
              <h4>{activeCrawler.stream.title}</h4>
              <p>{activeCrawler.stream.channelTitle}</p>
              <ViewCount>{activeCrawler.stream.viewerCount?.toLocaleString()} 觀看中</ViewCount>
            </StreamDetails>
          </StreamInfo>

          {crawlerStats && (
            <StatsGrid>
              <StatItem>
                <StatLabel>運行時間</StatLabel>
                <StatValue>{formatUptime(crawlerStats.uptime)}</StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>錯誤次數</StatLabel>
                <StatValue>{crawlerStats.errorCount}</StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>輪詢間隔</StatLabel>
                <StatValue>{(crawlerStats.pollingInterval / 1000).toFixed(1)}s</StatValue>
              </StatItem>
            </StatsGrid>
          )}

          <StopButton onClick={handleStopCrawler}>
            停止爬蟲
          </StopButton>
        </ActiveCrawlerCard>
      )}

      <SearchSection>
        <SearchTitle>搜尋直播</SearchTitle>
        <SearchBar>
          <SearchInput
            type="text"
            placeholder="輸入頻道名稱或關鍵字..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <SearchButton onClick={handleSearch} disabled={isSearching}>
            {isSearching ? '搜尋中...' : '搜尋'}
          </SearchButton>
        </SearchBar>
      </SearchSection>

      <StreamGrid>
        {streams.map((stream) => (
          <StreamCard key={stream.id}>
            <StreamThumbnail src={stream.thumbnailUrl} alt={stream.title} />
            <StreamContent>
              <StreamTitle>{stream.title}</StreamTitle>
              <ChannelName>{stream.channelTitle}</ChannelName>
              <ViewerCount>{stream.viewerCount?.toLocaleString()} 觀看中</ViewerCount>

              <StartButton
                onClick={() => handleStartCrawler(stream)}
                disabled={!!activeCrawler}
              >
                {activeCrawler ? '已有活動爬蟲' : '開始爬取'}
              </StartButton>
            </StreamContent>
          </StreamCard>
        ))}
      </StreamGrid>

      {streams.length === 0 && !isSearching && (
        <EmptyState>
          <EmptyIcon>🔍</EmptyIcon>
          <p>搜尋 YouTube 直播以開始爬取聊天室訊息</p>
        </EmptyState>
      )}
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const Title = styled.h1`
  color: white;
  font-size: 2rem;
  margin: 0;
`;

const ActiveCrawlerCard = styled.div`
  background: rgba(16, 185, 129, 0.1);
  border: 2px solid #10b981;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;

  h3 {
    color: white;
    margin: 0;
  }
`;

const StatusDot = styled.div`
  width: 12px;
  height: 12px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const StreamInfo = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const Thumbnail = styled.img`
  width: 160px;
  height: 90px;
  border-radius: 8px;
  object-fit: cover;
`;

const StreamDetails = styled.div`
  flex: 1;

  h4 {
    color: white;
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
  }

  p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0 0 0.5rem 0;
  }
`;

const ViewCount = styled.div`
  color: #10b981;
  font-size: 0.9rem;
  font-weight: 600;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatItem = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
`;

const StopButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #ef4444;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.3);
  }
`;

const SearchSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const SearchTitle = styled.h2`
  color: white;
  margin: 0 0 1rem 0;
`;

const SearchBar = styled.div`
  display: flex;
  gap: 1rem;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 1rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const SearchButton = styled.button`
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const StreamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
`;

const StreamCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const StreamThumbnail = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
`;

const StreamContent = styled.div`
  padding: 1rem;
`;

const StreamTitle = styled.h3`
  color: white;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ChannelName = styled.p`
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
`;

const ViewerCount = styled.div`
  color: #ef4444;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const StartButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    cursor: not-allowed;
    transform: none;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.6);
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

export default YouTubeControl;
