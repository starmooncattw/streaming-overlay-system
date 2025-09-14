import express from 'express';
import { param, validationResult } from 'express-validator';
import { query } from '../config/database';
import { logger } from '../config/logger';
import { getRedisClient } from '../config/redis';

const router = express.Router();

// 獲取聊天室顯示內容
router.get('/chat/:userId/:styleId', [
  param('userId').isLength({ min: 8, max: 20 }).withMessage('Invalid user ID'),
  param('styleId').isLength({ min: 1, max: 50 }).withMessage('Invalid style ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, styleId } = req.params;

    // 獲取用戶和樣式資訊
    const userResult = await query(
      'SELECT id FROM users WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // 獲取樣式設定
    const styleResult = await query(`
      SELECT * FROM styles 
      WHERE user_id = $1 AND style_id = $2 AND type = 'chat' AND is_active = true
    `, [user.id, styleId]);

    if (styleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chat style not found'
      });
    }

    const style = styleResult.rows[0];

    // 獲取最近的聊天訊息 (測試階段使用手動訊息)
    const messagesResult = await query(`
      SELECT username, message, platform, timestamp
      FROM chat_messages
      WHERE user_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `, [user.id, style.config.maxMessages || 10]);

    const messages = messagesResult.rows.map(msg => ({
      id: `${msg.timestamp}-${msg.username}`,
      username: msg.username,
      message: msg.message,
      platform: msg.platform,
      timestamp: msg.timestamp,
      isNew: false // 第一階段都標記為舊訊息
    }));

    res.json({
      success: true,
      data: {
        style: {
          id: style.style_id,
          name: style.name,
          config: style.config
        },
        messages: messages.reverse(), // 最舊的在前面
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Get chat display error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat display'
    });
  }
});

// 獲取斗內進度軸顯示內容
router.get('/donation/:userId/:styleId', [
  param('userId').isLength({ min: 8, max: 20 }).withMessage('Invalid user ID'),
  param('styleId').isLength({ min: 1, max: 50 }).withMessage('Invalid style ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, styleId } = req.params;

    // 獲取用戶資訊
    const userResult = await query(
      'SELECT id FROM users WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // 獲取樣式設定
    const styleResult = await query(`
      SELECT * FROM styles 
      WHERE user_id = $1 AND style_id = $2 AND type = 'donation' AND is_active = true
    `, [user.id, styleId]);

    if (styleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donation style not found'
      });
    }

    const style = styleResult.rows[0];

    // 獲取斗內進度資訊
    const progressResult = await query(`
      SELECT * FROM donation_progress 
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `, [user.id]);

    let progress = {
      goalAmount: 1000,
      currentAmount: 0,
      goalTitle: '今日斗內目標',
      percentage: 0
    };

    if (progressResult.rows.length > 0) {
      const prog = progressResult.rows[0];
      progress = {
        goalAmount: prog.goal_amount,
        currentAmount: prog.current_amount,
        goalTitle: prog.goal_title || '斗內目標',
        percentage: prog.goal_amount > 0 ? Math.round((prog.current_amount / prog.goal_amount) * 100) : 0
      };
    }

    res.json({
      success: true,
      data: {
        style: {
          id: style.style_id,
          name: style.name,
          config: style.config
        },
        progress,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Get donation display error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get donation display'
    });
  }
});

// 獲取時鐘顯示內容
router.get('/clock/:userId/:styleId', [
  param('userId').isLength({ min: 8, max: 20 }).withMessage('Invalid user ID'),
  param('styleId').isLength({ min: 1, max: 50 }).withMessage('Invalid style ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, styleId } = req.params;

    // 獲取用戶資訊
    const userResult = await query(
      'SELECT id FROM users WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // 獲取樣式設定
    const styleResult = await query(`
      SELECT * FROM styles 
      WHERE user_id = $1 AND style_id = $2 AND type = 'clock' AND is_active = true
    `, [user.id, styleId]);

    if (styleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Clock style not found'
      });
    }

    const style = styleResult.rows[0];

    // 獲取用戶時區設定
    const settingsResult = await query(
      'SELECT timezone FROM user_settings WHERE user_id = $1',
      [user.id]
    );

    const timezone = settingsResult.rows[0]?.timezone || 'Asia/Taipei';

    res.json({
      success: true,
      data: {
        style: {
          id: style.style_id,
          name: style.name,
          config: style.config
        },
        timezone,
        serverTime: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Get clock display error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get clock display'
    });
  }
});

// 獲取 Loading 頁面顯示內容
router.get('/loading/:userId/:styleId', [
  param('userId').isLength({ min: 8, max: 20 }).withMessage('Invalid user ID'),
  param('styleId').isLength({ min: 1, max: 50 }).withMessage('Invalid style ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, styleId } = req.params;

    // 獲取用戶資訊
    const userResult = await query(
      'SELECT id FROM users WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // 獲取樣式設定
    const styleResult = await query(`
      SELECT * FROM styles 
      WHERE user_id = $1 AND style_id = $2 AND type = 'loading' AND is_active = true
    `, [user.id, styleId]);

    if (styleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Loading style not found'
      });
    }

    const style = styleResult.rows[0];

    res.json({
      success: true,
      data: {
        style: {
          id: style.style_id,
          name: style.name,
          config: style.config
        }
      }
    });

  } catch (error) {
    logger.error('Get loading display error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get loading display'
    });
  }
});

// Server-Sent Events 用於即時更新
router.get('/stream/:userId/:type', async (req, res) => {
  const { userId, type } = req.params;

  // 設定 SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // 發送初始連接確認
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  try {
    // 驗證用戶存在
    const userResult = await query(
      'SELECT id FROM users WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'User not found' })}\n\n`);
      res.end();
      return;
    }

    // 設定心跳機制
    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
    }, 30000);

    // 設定 Redis 訂閱（如果需要）
    const redis = getRedisClient();
    const channelName = `display:${userId}:${type}`;
    
    // 處理客戶端斷開連接
    req.on('close', () => {
      clearInterval(heartbeat);
      // 取消 Redis 訂閱
      if (redis) {
        redis.unsubscribe(channelName);
      }
      logger.info(`SSE connection closed for ${userId}:${type}`);
    });

  } catch (error) {
    logger.error('SSE setup error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Connection failed' })}\n\n`);
    res.end();
  }
});

export default router;