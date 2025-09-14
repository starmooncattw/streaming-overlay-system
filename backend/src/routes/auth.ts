import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { admin } from '../config/firebase';
import { query } from '../config/database';
import { logger } from '../config/logger';
import { AuthenticatedRequest } from '../types/auth';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Google 登入
router.post('/google', [
  body('idToken').notEmpty().withMessage('ID token is required')
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

    const { idToken } = req.body;

    // 驗證 Google ID Token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      logger.error('Invalid Google ID token:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google ID token'
      });
    }

    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // 檢查用戶是否已存在
    let userResult = await query(
      'SELECT * FROM users WHERE email = $1 OR google_id = $2',
      [email, uid]
    );

    let user;
    let isNewUser = false;

    if (userResult.rows.length === 0) {
      // 創建新用戶
      isNewUser = true;
      const userId = generateUniqueUserId();
      
      const insertResult = await query(`
        INSERT INTO users (user_id, email, display_name, avatar_url, google_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [userId, email, name || '', picture || '', uid]);

      user = insertResult.rows[0];

      // 創建用戶預設設定
      await query(`
        INSERT INTO user_settings (user_id, language, theme)
        VALUES ($1, 'zh-TW', 'light')
      `, [user.id]);

      // 創建預設斗內進度
      await query(`
        INSERT INTO donation_progress (user_id, goal_amount, current_amount, goal_title)
        VALUES ($1, 1000, 0, '今日斗內目標')
      `, [user.id]);

      logger.info(`New user created: ${user.user_id} (${email})`);
    } else {
      // 更新現有用戶資訊
      user = userResult.rows[0];
      
      await query(`
        UPDATE users 
        SET display_name = $1, avatar_url = $2, last_login = NOW(), google_id = $3
        WHERE id = $4
      `, [name || user.display_name, picture || user.avatar_url, uid, user.id]);

      logger.info(`User login: ${user.user_id} (${email})`);
    }

    // 更新最後登入時間
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // 記錄活動日誌
    await query(`
      INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, 'login', $2, $3, $4)
    `, [
      user.id,
      JSON.stringify({ method: 'google', isNewUser }),
      req.ip,
      req.get('User-Agent')
    ]);

    // 生成 JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        userCode: user.user_id,
        email: user.email
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          userId: user.user_id,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          isNewUser
        }
      }
    });

  } catch (error) {
    logger.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
});

// 獲取當前用戶資訊
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userResult = await query(`
      SELECT u.*, us.language, us.theme, us.timezone
      FROM users u
      LEFT JOIN user_settings us ON u.id = us.user_id
      WHERE u.id = $1
    `, [req.user!.userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        userId: user.user_id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        lastLogin: user.last_login,
        settings: {
          language: user.language || 'zh-TW',
          theme: user.theme || 'light',
          timezone: user.timezone || 'Asia/Taipei'
        }
      }
    });

  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// 更新用戶設定
router.put('/settings', [
  authenticateToken,
  body('language').optional().isIn(['zh-TW', 'en']).withMessage('Invalid language'),
  body('theme').optional().isIn(['light', 'dark']).withMessage('Invalid theme'),
  body('timezone').optional().isString().withMessage('Invalid timezone')
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

    const { language, theme, timezone } = req.body;
    const userId = req.user!.userId;

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (language !== undefined) {
      updateFields.push(`language = $${paramIndex++}`);
      updateValues.push(language);
    }
    if (theme !== undefined) {
      updateFields.push(`theme = $${paramIndex++}`);
      updateValues.push(theme);
    }
    if (timezone !== undefined) {
      updateFields.push(`timezone = $${paramIndex++}`);
      updateValues.push(timezone);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(userId);

    await query(`
      UPDATE user_settings 
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramIndex}
    `, updateValues);

    // 記錄活動日誌
    await query(`
      INSERT INTO activity_logs (user_id, action, details)
      VALUES ($1, 'update_settings', $2)
    `, [userId, JSON.stringify({ language, theme, timezone })]);

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    logger.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// 登出 (主要是記錄日誌)
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // 記錄登出活動
    await query(`
      INSERT INTO activity_logs (user_id, action, ip_address, user_agent)
      VALUES ($1, 'logout', $2, $3)
    `, [req.user!.userId, req.ip, req.get('User-Agent')]);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// 刪除帳號 (軟刪除)
router.delete('/account', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    // 軟刪除用戶 (設為非活躍而不是真正刪除)
    await query(`
      UPDATE users 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
    `, [userId]);

    // 記錄活動日誌
    await query(`
      INSERT INTO activity_logs (user_id, action, details)
      VALUES ($1, 'account_deactivated', '{}')
    `, [userId]);

    logger.info(`User account deactivated: ${req.user!.userCode}`);

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    logger.error('Account deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account'
    });
  }
});

// 生成唯一的 user_id
function generateUniqueUserId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 檢查 user_id 是否可用
router.get('/check-userid/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      'SELECT COUNT(*) as count FROM users WHERE user_id = $1',
      [userId]
    );

    const isAvailable = parseInt(result.rows[0].count) === 0;

    res.json({
      success: true,
      data: {
        userId,
        available: isAvailable
      }
    });

  } catch (error) {
    logger.error('Check user ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check user ID'
    });
  }
});

export default router;