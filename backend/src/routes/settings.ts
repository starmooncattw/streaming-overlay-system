import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { logger } from '../config/logger';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';

const router = express.Router();

// 取得使用者設定
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const settingsResult = await query(`
      SELECT 
        language,
        theme,
        timezone,
        notifications,
        created_at,
        updated_at
      FROM user_settings 
      WHERE user_id = $1
    `, [userId]);

    let settings = {
      language: 'zh-TW',
      theme: 'light',
      timezone: 'Asia/Taipei',
      notifications: {},
      createdAt: null,
      updatedAt: null
    };

    if (settingsResult.rows.length > 0) {
      const row = settingsResult.rows[0];
      settings = {
        language: row.language,
        theme: row.theme,
        timezone: row.timezone,
        notifications: row.notifications || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    logger.error('Get user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user settings'
    });
  }
});

// 更新使用者設定
router.put('/', [
  authenticateToken,
  body('language').optional().isIn(['zh-TW', 'en']).withMessage('Invalid language'),
  body('theme').optional().isIn(['light', 'dark']).withMessage('Invalid theme'),
  body('timezone').optional().isString().withMessage('Invalid timezone'),
  body('notifications').optional().isObject().withMessage('Notifications must be an object')
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
    const { language, theme, timezone, notifications } = req.body;

    // 檢查設定是否存在
    const existingSettings = await query(
      'SELECT id FROM user_settings WHERE user_id = $1',
      [userId]
    );

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
    if (notifications !== undefined) {
      updateFields.push(`notifications = $${paramIndex++}`);
      updateValues.push(JSON.stringify(notifications));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(userId);

    if (existingSettings.rows.length > 0) {
      // 更新現有設定
      await query(`
        UPDATE user_settings 
        SET ${updateFields.join(', ')}
        WHERE user_id = $${paramIndex}
      `, updateValues);
    } else {
      // 建立新設定記錄
      await query(`
        INSERT INTO user_settings (
          user_id, 
          language, 
          theme, 
          timezone, 
          notifications
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        userId,
        language || 'zh-TW',
        theme || 'light',
        timezone || 'Asia/Taipei',
        JSON.stringify(notifications || {})
      ]);
    }

    // 記錄活動日誌
    await query(`
      INSERT INTO activity_logs (user_id, action, details)
      VALUES ($1, 'update_settings', $2)
    `, [userId, JSON.stringify({ language, theme, timezone, notifications })]);

    logger.info(`使用者設定已更新 - User: ${req.user!.userCode}`);

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    logger.error('Update user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// 重置設定為預設值
router.post('/reset', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const defaultSettings = {
      language: 'zh-TW',
      theme: 'light',
      timezone: 'Asia/Taipei',
      notifications: {}
    };

    // 檢查設定是否存在
    const existingSettings = await query(
      'SELECT id FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (existingSettings.rows.length > 0) {
      // 更新為預設值
      await query(`
        UPDATE user_settings 
        SET 
          language = $1,
          theme = $2,
          timezone = $3,
          notifications = $4,
          updated_at = NOW()
        WHERE user_id = $5
      `, [
        defaultSettings.language,
        defaultSettings.theme,
        defaultSettings.timezone,
        JSON.stringify(defaultSettings.notifications),
        userId
      ]);
    } else {
      // 建立預設設定
      await query(`
        INSERT INTO user_settings (user_id, language, theme, timezone, notifications)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        userId,
        defaultSettings.language,
        defaultSettings.theme,
        defaultSettings.timezone,
        JSON.stringify(defaultSettings.notifications)
      ]);
    }

    // 記錄活動日誌
    await query(`
      INSERT INTO activity_logs (user_id, action, details)
      VALUES ($1, 'reset_settings', $2)
    `, [userId, JSON.stringify(defaultSettings)]);

    logger.info(`使用者設定已重置 - User: ${req.user!.userCode}`);

    res.json({
      success: true,
      message: 'Settings reset to default successfully',
      data: defaultSettings
    });

  } catch (error) {
    logger.error('Reset user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings'
    });
  }
});

// 取得支援的語言清單
router.get('/languages', (req, res) => {
  const supportedLanguages = [
    {
      code: 'zh-TW',
      name: '繁體中文',
      englishName: 'Traditional Chinese'
    },
    {
      code: 'en',
      name: 'English',
      englishName: 'English'
    }
  ];

  res.json({
    success: true,
    data: supportedLanguages
  });
});

// 取得支援的主題清單
router.get('/themes', (req, res) => {
  const supportedThemes = [
    {
      value: 'light',
      name: '亮色主題',
      englishName: 'Light Theme',
      description: '適合白天使用的明亮主題'
    },
    {
      value: 'dark',
      name: '暗色主題',
      englishName: 'Dark Theme',
      description: '適合夜晚使用的深色主題'
    }
  ];

  res.json({
    success: true,
    data: supportedThemes
  });
});

// 取得支援的時區清單
router.get('/timezones', (req, res) => {
  const commonTimezones = [
    {
      value: 'Asia/Taipei',
      name: '台北時間 (UTC+8)',
      offset: '+08:00'
    },
    {
      value: 'Asia/Shanghai',
      name: '北京時間 (UTC+8)',
      offset: '+08:00'
    },
    {
      value: 'Asia/Hong_Kong',
      name: '香港時間 (UTC+8)',
      offset: '+08:00'
    },
    {
      value: 'Asia/Tokyo',
      name: '東京時間 (UTC+9)',
      offset: '+09:00'
    },
    {
      value: 'Asia/Seoul',
      name: '首爾時間 (UTC+9)',
      offset: '+09:00'
    },
    {
      value: 'America/New_York',
      name: '紐約時間 (UTC-5)',
      offset: '-05:00'
    },
    {
      value: 'America/Los_Angeles',
      name: '洛杉磯時間 (UTC-8)',
      offset: '-08:00'
    },
    {
      value: 'Europe/London',
      name: '倫敦時間 (UTC+0)',
      offset: '+00:00'
    },
    {
      value: 'Europe/Paris',
      name: '巴黎時間 (UTC+1)',
      offset: '+01:00'
    },
    {
      value: 'UTC',
      name: '協調世界時 (UTC)',
      offset: '+00:00'
    }
  ];

  res.json({
    success: true,
    data: commonTimezones
  });
});

// 通知設定相關 API
router.get('/notifications', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const settingsResult = await query(`
      SELECT notifications FROM user_settings WHERE user_id = $1
    `, [userId]);

    let notifications = {
      email: {
        enabled: false,
        newMessage: false,
        donationReceived: false,
        systemUpdates: false
      },
      browser: {
        enabled: false,
        newMessage: false,
        donationReceived: false
      }
    };

    if (settingsResult.rows.length > 0 && settingsResult.rows[0].notifications) {
      notifications = { ...notifications, ...settingsResult.rows[0].notifications };
    }

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    logger.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification settings'
    });
  }
});

router.put('/notifications', [
  authenticateToken,
  body('notifications').isObject().withMessage('Notifications must be an object')
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
    const { notifications } = req.body;

    // 更新通知設定
    await query(`
      UPDATE user_settings 
      SET notifications = $1, updated_at = NOW()
      WHERE user_id = $2
    `, [JSON.stringify(notifications), userId]);

    // 記錄活動日誌
    await query(`
      INSERT INTO activity_logs (user_id, action, details)
      VALUES ($1, 'update_notification_settings', $2)
    `, [userId, JSON.stringify(notifications)]);

    logger.info(`通知設定已更新 - User: ${req.user!.userCode}`);

    res.json({
      success: true,
      message: 'Notification settings updated successfully'
    });

  } catch (error) {
    logger.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings'
    });
  }
});

export default router;