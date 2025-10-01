const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const youtubeApiService = require('../services/youtubeApiService');
const youtubeCrawlerService = require('../services/youtubeCrawlerService');

const oauth2Client = new OAuth2Client(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

/**
 * 生成 OAuth 授權 URL
 */
router.get('/auth/url', (req, res) => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('生成授權 URL 失敗:', error);
    res.status(500).json({ error: '生成授權 URL 失敗' });
  }
});

/**
 * OAuth 回調處理
 */
router.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: '缺少授權碼' });
    }

    const { tokens } = await oauth2Client.getToken(code);

    res.json({
      success: true,
      credentials: tokens
    });
  } catch (error) {
    console.error('OAuth 回調失敗:', error);
    res.status(500).json({ error: 'OAuth 認證失敗' });
  }
});

/**
 * 刷新存取令牌
 */
router.post('/auth/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: '缺少 refresh token' });
    }

    oauth2Client.setCredentials({ refresh_token });
    const { credentials } = await oauth2Client.refreshAccessToken();

    res.json({
      success: true,
      credentials
    });
  } catch (error) {
    console.error('刷新令牌失敗:', error);
    res.status(500).json({ error: '刷新令牌失敗' });
  }
});

/**
 * 搜尋進行中的直播
 */
router.post('/search', async (req, res) => {
  try {
    const { query, credentials, maxResults = 10 } = req.body;

    if (!query || !credentials) {
      return res.status(400).json({ error: '缺少必要參數' });
    }

    youtubeApiService.setCredentials(credentials);
    const streams = await youtubeApiService.searchLiveStreams(query, maxResults);

    res.json({
      success: true,
      streams
    });
  } catch (error) {
    console.error('搜尋直播失敗:', error);
    res.status(500).json({ error: '搜尋直播失敗' });
  }
});

/**
 * 獲取影片詳情
 */
router.post('/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { credentials } = req.body;

    if (!credentials) {
      return res.status(400).json({ error: '缺少認證資訊' });
    }

    youtubeApiService.setCredentials(credentials);
    const videoDetails = await youtubeApiService.getVideoDetails(videoId);

    if (!videoDetails) {
      return res.status(404).json({ error: '找不到影片或不是進行中的直播' });
    }

    res.json({
      success: true,
      video: videoDetails
    });
  } catch (error) {
    console.error('獲取影片詳情失敗:', error);
    res.status(500).json({ error: '獲取影片詳情失敗' });
  }
});

/**
 * 開始爬蟲
 */
router.post('/crawler/start', async (req, res) => {
  try {
    const { streamerId, videoId, credentials } = req.body;

    if (!streamerId || !videoId || !credentials) {
      return res.status(400).json({ error: '缺少必要參數' });
    }

    const io = req.app.get('io');

    // 定義訊息回調函數
    const onMessage = (message) => {
      // 透過 Socket.IO 廣播訊息
      io.to(`stream-${streamerId}`).emit('youtube-message', message);
    };

    const success = await youtubeCrawlerService.startCrawling(
      streamerId,
      videoId,
      credentials,
      onMessage
    );

    if (!success) {
      return res.status(500).json({ error: '啟動爬蟲失敗' });
    }

    res.json({
      success: true,
      message: '爬蟲已啟動'
    });
  } catch (error) {
    console.error('啟動爬蟲失敗:', error);
    res.status(500).json({ error: '啟動爬蟲失敗' });
  }
});

/**
 * 停止爬蟲
 */
router.post('/crawler/stop', (req, res) => {
  try {
    const { streamerId } = req.body;

    if (!streamerId) {
      return res.status(400).json({ error: '缺少 streamerId' });
    }

    youtubeCrawlerService.stopCrawling(streamerId);

    res.json({
      success: true,
      message: '爬蟲已停止'
    });
  } catch (error) {
    console.error('停止爬蟲失敗:', error);
    res.status(500).json({ error: '停止爬蟲失敗' });
  }
});

/**
 * 獲取爬蟲狀態
 */
router.get('/crawler/status/:streamerId', (req, res) => {
  try {
    const { streamerId } = req.params;
    const stats = youtubeCrawlerService.getSessionStats(streamerId);

    if (!stats) {
      return res.status(404).json({ error: '找不到爬蟲會話' });
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('獲取爬蟲狀態失敗:', error);
    res.status(500).json({ error: '獲取爬蟲狀態失敗' });
  }
});

/**
 * 獲取所有爬蟲會話
 */
router.get('/crawler/sessions', (req, res) => {
  try {
    const sessions = youtubeCrawlerService.getAllSessions();

    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('獲取爬蟲會話失敗:', error);
    res.status(500).json({ error: '獲取爬蟲會話失敗' });
  }
});

module.exports = router;
