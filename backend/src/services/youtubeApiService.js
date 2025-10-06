const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

/**
 * YouTube API 服務
 */
class YouTubeApiService {
  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    this.youtube = google.youtube({
      version: 'v3',
      auth: this.oauth2Client
    });
  }

  /**
   * 設定使用者憑證
   * @param {Object} credentials - 使用者憑證
   */
  setCredentials(credentials) {
    this.oauth2Client.setCredentials(credentials);
  }

  /**
   * 搜尋進行中的直播
   * @param {string} query - 搜尋關鍵字
   * @param {number} maxResults - 最大結果數
   * @returns {Promise<Array>} 直播列表
   */
  async searchLiveStreams(query, maxResults = 10) {
    try {
      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        type: ['video'],
        eventType: 'live',
        maxResults: maxResults,
        order: 'viewCount'
      });

      if (!response.data.items) {
        return [];
      }

      const streams = [];

      for (const item of response.data.items) {
        if (!item.id?.videoId) continue;

        // 獲取詳細資訊
        const videoDetails = await this.getVideoDetails(item.id.videoId);
        if (videoDetails) {
          streams.push(videoDetails);
        }
      }

      return streams;
    } catch (error) {
      console.error('搜尋直播失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取影片詳細資訊
   * @param {string} videoId - 影片 ID
   * @returns {Promise<Object|null>} 影片詳情
   */
  async getVideoDetails(videoId) {
    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'liveStreamingDetails', 'statistics'],
        id: [videoId]
      });

      const video = response.data.items?.[0];
      if (!video || !video.liveStreamingDetails?.activeLiveChatId) {
        return null;
      }

      return {
        id: videoId,
        title: video.snippet?.title || '',
        description: video.snippet?.description || '',
        channelId: video.snippet?.channelId || '',
        channelTitle: video.snippet?.channelTitle || '',
        thumbnailUrl: video.snippet?.thumbnails?.medium?.url || '',
        viewerCount: parseInt(video.liveStreamingDetails.concurrentViewers || '0'),
        startTime: video.liveStreamingDetails.actualStartTime || '',
        chatId: video.liveStreamingDetails.activeLiveChatId
      };
    } catch (error) {
      console.error('獲取影片詳情失敗:', error);
      return null;
    }
  }

  /**
   * 獲取聊天室訊息
   * @param {string} chatId - 聊天室 ID
   * @param {string} [pageToken] - 頁面令牌
   * @returns {Promise<Object>} 訊息資料
   */
  async getChatMessages(chatId, pageToken) {
    try {
      const response = await this.youtube.liveChatMessages.list({
        liveChatId: chatId,
        part: ['snippet', 'authorDetails'],
        maxResults: 200,
        pageToken: pageToken
      });

      return {
        messages: response.data.items || [],
        nextPageToken: response.data.nextPageToken,
        pollingIntervalMillis: response.data.pollingIntervalMillis || 5000
      };
    } catch (error) {
      console.error('獲取聊天訊息失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取頻道資訊
   * @param {string} channelId - 頻道 ID
   * @returns {Promise<Object|null>} 頻道資訊
   */
  async getChannelInfo(channelId) {
    try {
      const response = await this.youtube.channels.list({
        part: ['snippet', 'statistics'],
        id: [channelId]
      });

      return response.data.items?.[0] || null;
    } catch (error) {
      console.error('獲取頻道資訊失敗:', error);
      return null;
    }
  }
}

// 單例模式
const youtubeApiService = new YouTubeApiService();

module.exports = youtubeApiService;
