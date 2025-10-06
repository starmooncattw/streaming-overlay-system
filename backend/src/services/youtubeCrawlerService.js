const { v4: uuidv4 } = require('uuid');
const youtubeApiService = require('./youtubeApiService');

/**
 * YouTube 聊天室爬蟲服務
 */
class YouTubeCrawlerService {
  constructor() {
    this.sessions = new Map();
    this.MAX_ERROR_COUNT = 5;
    this.DEFAULT_POLLING_INTERVAL = 5000;
    this.MAX_SESSIONS = 5;
  }

  /**
   * 開始爬蟲會話
   * @param {string} streamerId - 直播主 ID
   * @param {string} videoId - 影片 ID
   * @param {Object} credentials - 使用者憑證
   * @param {Function} onMessage - 訊息回調函數
   * @returns {Promise<boolean>} 是否成功
   */
  async startCrawling(streamerId, videoId, credentials, onMessage) {
    try {
      // 檢查會話數量限制
      if (this.sessions.size >= this.MAX_SESSIONS) {
        throw new Error('達到最大會話數量限制');
      }

      // 設定 API 憑證
      youtubeApiService.setCredentials(credentials);

      // 獲取影片詳情
      const videoDetails = await youtubeApiService.getVideoDetails(videoId);
      if (!videoDetails) {
        throw new Error('無法獲取影片詳情');
      }

      // 建立爬蟲會話
      const session = {
        streamerId,
        videoId,
        chatId: videoDetails.chatId,
        isActive: true,
        pollingInterval: this.DEFAULT_POLLING_INTERVAL,
        lastMessageTime: new Date(),
        errorCount: 0,
        startTime: new Date(),
        onMessage
      };

      this.sessions.set(streamerId, session);

      // 開始爬蟲循環
      this.startCrawlingLoop(session);

      console.log(`開始爬蟲會話: ${streamerId} (${videoId})`);
      return true;
    } catch (error) {
      console.error('啟動爬蟲失敗:', error);
      return false;
    }
  }

  /**
   * 停止爬蟲會話
   * @param {string} streamerId - 直播主 ID
   */
  stopCrawling(streamerId) {
    const session = this.sessions.get(streamerId);
    if (session) {
      session.isActive = false;
      this.sessions.delete(streamerId);
      console.log(`停止爬蟲會話: ${streamerId}`);
    }
  }

  /**
   * 爬蟲循環
   * @param {Object} session - 會話物件
   */
  async startCrawlingLoop(session) {
    while (session.isActive) {
      try {
        await this.crawlMessages(session);
        session.errorCount = 0; // 重置錯誤計數

        // 等待下次輪詢
        await this.sleep(session.pollingInterval);
      } catch (error) {
        console.error(`爬蟲錯誤 (${session.streamerId}):`, error);
        session.errorCount++;

        if (session.errorCount >= this.MAX_ERROR_COUNT) {
          console.error(`會話 ${session.streamerId} 錯誤次數過多，停止爬蟲`);
          this.stopCrawling(session.streamerId);
          break;
        }

        // 錯誤後等待較長時間
        await this.sleep(session.pollingInterval * 2);
      }
    }
  }

  /**
   * 爬取訊息
   * @param {Object} session - 會話物件
   */
  async crawlMessages(session) {
    const result = await youtubeApiService.getChatMessages(
      session.chatId,
      session.nextPageToken
    );

    // 更新輪詢間隔
    session.pollingInterval = result.pollingIntervalMillis || this.DEFAULT_POLLING_INTERVAL;
    session.nextPageToken = result.nextPageToken;

    // 處理訊息
    for (const item of result.messages) {
      const message = this.parseYouTubeMessage(item, session.streamerId);
      if (message && session.onMessage) {
        session.onMessage(message);
      }
    }

    session.lastMessageTime = new Date();
  }

  /**
   * 解析 YouTube 訊息
   * @param {Object} item - YouTube 訊息項目
   * @param {string} streamerId - 直播主 ID
   * @returns {Object|null} 解析後的訊息
   */
  parseYouTubeMessage(item, streamerId) {
    try {
      const snippet = item.snippet;
      const author = item.authorDetails;

      if (!snippet || !author) return null;

      return {
        id: uuidv4(),
        streamerId,
        username: author.displayName || 'Unknown',
        message: snippet.displayMessage || '',
        timestamp: new Date(snippet.publishedAt),
        platform: 'youtube',
        metadata: {
          userId: author.channelId,
          badges: author.isChatModerator ? ['moderator'] : [],
          color: '#1976d2' // YouTube 預設顏色
        }
      };
    } catch (error) {
      console.error('解析 YouTube 訊息失敗:', error);
      return null;
    }
  }

  /**
   * 獲取會話統計
   * @param {string} streamerId - 直播主 ID
   * @returns {Object|null} 統計資料
   */
  getSessionStats(streamerId) {
    const session = this.sessions.get(streamerId);
    if (!session) return null;

    return {
      isActive: session.isActive,
      videoId: session.videoId,
      pollingInterval: session.pollingInterval,
      errorCount: session.errorCount,
      uptime: Date.now() - session.startTime.getTime(),
      lastMessageTime: session.lastMessageTime
    };
  }

  /**
   * 獲取所有會話統計
   * @returns {Array} 所有會話統計
   */
  getAllSessions() {
    return Array.from(this.sessions.entries()).map(([streamerId, session]) => ({
      streamerId,
      ...this.getSessionStats(streamerId)
    }));
  }

  /**
   * 延遲函數
   * @param {number} ms - 毫秒數
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 單例模式
const youtubeCrawlerService = new YouTubeCrawlerService();

module.exports = youtubeCrawlerService;
