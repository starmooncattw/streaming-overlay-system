import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { logger } from '../config/logger';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';

const router = express.Router();

// 取得使用者資料
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const userResult = await query(`
      SELECT 
        u.id,
        u.user_id,
        u.email,
        u.display_name,
        u.avatar_url,
        u.last_login,
        u.created_at,
        us.language,
        us.theme,
        us.timezone,
        us.notifications
      FROM users u
      LEFT JOIN user_settings us ON u.id = us.user_id
      WHERE u.id = $1 AND u.is_active = true
    `, [userId]);

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
        createdAt: user.created_at,
        settings: {
          language: user.language || 'zh-TW',
          theme: user.theme || 'light',
          timezone: user.timezone || 'Asia/Taipei',
          notifications: user.notifications || {}
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

// 更新使用者資料
router.put('/profile', [
  authenticateToken,
  body('displayName').optional().isLength({ min: 1, max: 100 }).withMessage('Display name must be 1-100 characters'),
  body('avatarUrl').optional().isURL().withMessage('Invalid avatar URL')
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

    const userId = req.user!.userId;
    const { displayName, avatarUrl } = req.body;

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (displayName !== undefined) {
      updateFields.push(`display_name = $${paramIndex++}`);
      updateValues.push(displayName);
    }
    if (avatarUrl !== undefined) {
      updateFields.push(`avatar_url = $${paramIndex++}`);
      updateValues.push(avatarUrl);
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
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
    `, updateValues);

    // 記錄活動日誌
    await query(`
      INSERT INTO activity_logs (user_id, action, details)
      VALUES ($1, 'update_profile', $2)
    `, [userId, JSON.stringify({ displayName, avatarUrl })]);

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// 取得使用者統計資訊
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    // 取得各種統計資訊
    const [stylesResult, messagesResult, progressResult] = await Promise.all([
      // 樣式統計
      query(`
        SELECT 
          type,
          COUNT(*) as count
        FROM styles 
        WHERE user_id = $1 AND is_active = true
        GROUP BY type
      `, [userId]),
      
      // 聊天訊息統計
      query(`
        SELECT 
          COUNT(*) as total_messages,
          COUNT(DISTINCT username) as unique_users,
          platform,
          COUNT(*) as platform_count
        FROM chat_messages 
        WHERE user_id = $1
        GROUP BY platform
      `, [userId]),
      
      // 斗內進度統計
      query(`
        SELECT 
          SUM(goal_amount) as total_goal,
          SUM(current_amount) as total_raised,
          COUNT(*) as total_campaigns
        FROM donation_progress 
        WHERE user_id = $1
      `, [userId])
    ]);

    const stats = {
      styles: stylesResult.rows.reduce((acc, row) => {
        acc[row.type] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>),
      
      messages: {
        total: messagesResult.rows.reduce((sum, row) => sum + parseInt(row.platform_count), 0),
        uniqueUsers: messagesResult.rows[0]?.unique_users || 0,
        byPlatform: messagesResult.rows.reduce((acc, row) => {
          acc[row.platform] = parseInt(row.platform_count);
          return acc;
        }, {} as Record<string, number>)
      },

      donations: {
        totalGoal: parseInt(progressResult.rows[0]?.total_goal || 0),
        totalRaised: parseInt(progressResult.rows[0]?.total_raised || 0),
        totalCampaigns: parseInt(progressResult.rows[0]?.total_campaigns || 0)
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    });
  }
});

// 取得使用者活動記錄
router.get('/activity', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    // 取得活動記錄
    const activitiesResult = await query(`
      SELECT 
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        created_at
      FROM activity_logs 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    // 取得總數
    const countResult = await query(
      'SELECT COUNT(*) as total FROM activity_logs WHERE user_id = $1',
      [userId]
    );

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        activities: activitiesResult.rows.map(activity => ({
          action: activity.action,
          resourceType: activity.resource_type,
          resourceId: activity.resource_id,
          details: activity.details,
          ipAddress: activity.ip_address,
          timestamp: activity.created_at
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user activity'
    });
  }
});

// 匯出使用者資料
router.get('/export', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    // 取得所有使用者相關資料
    const [userResult, stylesResult, messagesResult, progressResult, settingsResult] = await Promise.all([
      query('SELECT * FROM users WHERE id = $1', [userId]),
      query('SELECT * FROM styles WHERE user_id = $1', [userId]),
      query('SELECT * FROM chat_messages WHERE user_id = $1', [userId]),
      query('SELECT * FROM donation_progress WHERE user_id = $1', [userId]),
      query('SELECT * FROM user_settings WHERE user_id = $1', [userId])
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      user: userResult.rows[0],
      styles: stylesResult.rows,
      messages: messagesResult.rows,
      donationProgress: progressResult.rows,
      settings: settingsResult.rows[0] || {}
    };

    // 記錄匯出活動
    await query(`
      INSERT INTO activity_logs (user_id, action, details)
      VALUES ($1, 'export_data', $2)
    `, [userId, JSON.stringify({ timestamp: new Date().toISOString() })]);

    res.json({
      success: true,
      data: exportData
    });

  } catch (error) {
    logger.error('Export user data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export user data'
    });
  }
});

// 刪除使用者帳號資料
router.delete('/data', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    // 軟刪除相關資料（設為非活躍）
    await query('BEGIN');

    try {
      // 停用使用者
      await query('UPDATE users SET is_active = false WHERE id = $1', [userId]);
      
      // 停用樣式
      await query('UPDATE styles SET is_active = false WHERE user_id = $1', [userId]);
      
      // 停用斗內進度
      await query('UPDATE donation_progress SET is_active = false WHERE user_id = $1', [userId]);

      // 記錄刪除活動
      await query(`
        INSERT INTO activity_logs (user_id, action, details)
        VALUES ($1, 'delete_account_data', $2)
      `, [userId, JSON.stringify({ timestamp: new Date().toISOString() })]);

      await query('COMMIT');

      res.json({
        success: true,
        message: 'User data deleted successfully'
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    logger.error('Delete user data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user data'
    });
  }
});

export default router;