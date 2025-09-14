import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { query } from '../config/database';
import { logger } from '../config/logger';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { io } from '../server';

const router = express.Router();

// 只在非生產環境中使用
if (process.env.NODE_ENV === 'production') {
  router.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not available in production' });
  });
}

// 發送測試聊天訊息
router.post('/chat-message', [
  authenticateToken,
  body('username').notEmpty().withMessage('Username is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('platform').optional().isIn(['manual', 'youtube', 'twitch']).withMessage('Invalid platform')
], async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, message, platform = 'manual' } = req.body;
    const userId = req.user!.userId;

    // 獲取用戶資訊
    const userResult = await query(
      'SELECT id, user_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // 插入測試聊天訊息
    const messageResult = await query(`
      INSERT INTO chat_messages (user_id, username, message, platform, is_test)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `, [userId, username, message, platform]);

    const newMessage = messageResult.rows[0];

    // 透過 Socket.IO 即時發送給前端
    const socketData = {
      id: newMessage.id,
      username: newMessage.username,
      message: newMessage.message,
      platform: newMessage.platform,
      timestamp: newMessage.timestamp,
      isNew: true,
      isTest: true
    };

    // 發送到特定用戶的聊天室頻道
    io.emit(`chat:${user.user_id}`, socketData);

    logger.info(`Test chat message sent for user ${user.user_id}: ${username}: ${message}`);

    res.json({
      success: true,
      message: 'Test chat message sent successfully',
      data: socketData
    });

  } catch (error) {
    logger.error('Send test chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test chat message'
    });
  }
});

// 更新斗內進度 (測試用)
router.post('/donation-progress', [
  authenticateToken,
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('operation').isIn(['add', 'set', 'subtract']).withMessage('Invalid operation')
], async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount, operation } = req.body;
    const userId = req.user!.userId;

    // 獲取用戶資訊
    const userResult = await query(
      'SELECT id, user_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // 獲取當前進度
    let progressResult = await query(
      'SELECT * FROM donation_progress WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    let currentAmount = 0;
    let goalAmount = 1000;
    let goalTitle = '今日斗內目標';

    if (progressResult.rows.length > 0) {
      const progress = progressResult.rows[0];
      currentAmount = progress.current_amount;
      goalAmount = progress.goal_amount;
      goalTitle = progress.goal_title;
    }

    // 計算新金額
    let newAmount = currentAmount;
    switch (operation) {
      case 'add':
        newAmount = currentAmount + parseInt(amount);
        break;
      case 'subtract':
        newAmount = Math.max(0, currentAmount - parseInt(amount));
        break;
      case 'set':
        newAmount = parseInt(amount);
        break;
    }

    // 更新進度
    if (progressResult.rows.length > 0) {
      await query(
        'UPDATE donation_progress SET current_amount = $1, updated_at = NOW() WHERE id = $2',
        [newAmount, progressResult.rows[0].id]
      );
    } else {
      await query(
        'INSERT INTO donation_progress (user_id, goal_amount, current_amount, goal_title) VALUES ($1, $2, $3, $4)',
        [userId, goalAmount, newAmount, goalTitle]
      );
    }

    const percentage = goalAmount > 0 ? Math.round((newAmount / goalAmount) * 100) : 0;

    // 透過 Socket.IO 即時發送更新
    const socketData = {
      goalAmount,
      currentAmount: newAmount,
      goalTitle,
      percentage,
      lastUpdate: new Date().toISOString(),
      isTest: true
    };

    io.emit(`donation:${user.user_id}`, socketData);

    logger.info(`Test donation progress updated for user ${user.user_id}: ${currentAmount} -> ${newAmount}`);

    res.json({
      success: true,
      message: 'Donation progress updated successfully',
      data: socketData
    });

  } catch (error) {
    logger.error('Update test donation progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update donation progress'
    });
  }
});

// 設定斗內目標
router.post('/donation-goal', [
  authenticateToken,
  body('goalAmount').isNumeric().withMessage('Goal amount must be a number'),
  body('goalTitle').optional().isString().withMessage('Goal title must be a string')
], async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { goalAmount, goalTitle = '斗內目標' } = req.body;
    const userId = req.user!.userId;

    // 獲取用戶資訊
    const userResult = await query(
      'SELECT id, user_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // 停用舊的目標
    await query(
      'UPDATE donation_progress SET is_active = false WHERE user_id = $1',
      [userId]
    );

    // 建立新目標
    const newGoalResult = await query(`
      INSERT INTO donation_progress (user_id, goal_amount, current_amount, goal_title)
      VALUES ($1, $2, 0, $3)
      RETURNING *
    `, [userId, parseInt(goalAmount), goalTitle]);

    const newGoal = newGoalResult.rows[0];

    // 透過 Socket.IO 即時發送更新
    const socketData = {
      goalAmount: newGoal.goal_amount,
      currentAmount: newGoal.current_amount,
      goalTitle: newGoal.goal_title,
      percentage: 0,
      lastUpdate: new Date().toISOString(),
      isTest: true
    };

    io.emit(`donation:${user.user_id}`, socketData);

    logger.info(`New donation goal set for user ${user.user_id}: ${goalTitle} - $${goalAmount}`);

    res.json({
      success: true,
      message: 'Donation goal set successfully',
      data: socketData
    });

  } catch (error) {
    logger.error('Set donation goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set donation goal'
    });
  }
});

// 清空聊天訊息
router.delete('/chat-messages', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    await query(
      'DELETE FROM chat_messages WHERE user_id = $1',
      [userId]
    );

    // 透過 Socket.IO 通知前端清空
    const userResult = await query(
      'SELECT user_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length > 0) {
      io.emit(`chat:${userResult.rows[0].user_id}`, { type: 'clear' });
    }

    logger.info(`Chat messages cleared for user ${userId}`);

    res.json({
      success: true,
      message: 'Chat messages cleared successfully'
    });

  } catch (error) {
    logger.error('Clear chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat messages'
    });
  }
});

// 重置斗內進度
router.post('/reset-donation', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    // 獲取用戶資訊
    const userResult = await query(
      'SELECT id, user_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // 重置當前進度為 0
    await query(
      'UPDATE donation_progress SET current_amount = 0, updated_at = NOW() WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    // 獲取更新後的資訊
    const progressResult = await query(
      'SELECT * FROM donation_progress WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    let socketData = {
      goalAmount: 1000,
      currentAmount: 0,
      goalTitle: '今日斗內目標',
      percentage: 0,
      lastUpdate: new Date().toISOString(),
      isTest: true
    };

    if (progressResult.rows.length > 0) {
      const progress = progressResult.rows[0];
      socketData = {
        goalAmount: progress.goal_amount,
        currentAmount: 0,
        goalTitle: progress.goal_title,
        percentage: 0,
        lastUpdate: new Date().toISOString(),
        isTest: true
      };
    }

    // 透過 Socket.IO 即時發送更新
    io.emit(`donation:${user.user_id}`, socketData);

    logger.info(`Donation progress reset for user ${user.user_id}`);

    res.json({
      success: true,
      message: 'Donation progress reset successfully',
      data: socketData
    });

  } catch (error) {
    logger.error('Reset donation progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset donation progress'
    });
  }
});

export default router;