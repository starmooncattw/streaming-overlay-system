import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { logger } from '../config/logger';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types/auth';
import { SocketEmitter } from '../services/socketService';
import { io } from '../server';

const router = express.Router();

// 取得使用者所有樣式
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const type = req.query.type as string;

    let whereClause = 'user_id = $1 AND is_active = true';
    const params = [userId];

    if (type && ['chat', 'donation', 'clock', 'loading'].includes(type)) {
      whereClause += ' AND type = $2';
      params.push(type);
    }

    const stylesResult = await query(`
      SELECT 
        style_id,
        type,
        name,
        config,
        created_at,
        updated_at
      FROM styles 
      WHERE ${whereClause}
      ORDER BY created_at DESC
    `, params);

    res.json({
      success: true,
      data: stylesResult.rows.map(style => ({
        id: style.style_id,
        type: style.type,
        name: style.name,
        config: style.config,
        createdAt: style.created_at,
        updatedAt: style.updated_at
      }))
    });

  } catch (error) {
    logger.error('Get styles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get styles'
    });
  }
});

// 取得特定樣式
router.get('/:styleId', [
  authenticateToken,
  param('styleId').notEmpty().withMessage('Style ID is required')
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
    const { styleId } = req.params;

    const styleResult = await query(`
      SELECT 
        style_id,
        type,
        name,
        config,
        created_at,
        updated_at
      FROM styles 
      WHERE user_id = $1 AND style_id = $2 AND is_active = true
    `, [userId, styleId]);

    if (styleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Style not found'
      });
    }

    const style = styleResult.rows[0];

    res.json({
      success: true,
      data: {
        id: style.style_id,
        type: style.type,
        name: style.name,
        config: style.config,
        createdAt: style.created_at,
        updatedAt: style.updated_at
      }
    });

  } catch (error) {
    logger.error('Get style error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get style'
    });
  }
});

// 建立新樣式
router.post('/', [
  authenticateToken,
  body('type').isIn(['chat', 'donation', 'clock', 'loading']).withMessage('Invalid style type'),
  body('name').isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('config').isObject().withMessage('Config must be an object')
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
    const { type, name, config } = req.body;
    const styleId = generateStyleId();

    // 驗證設定格式
    const validationError = validateStyleConfig(type, config);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const styleResult = await query(`
      INSERT INTO styles (user_id, style_id, type, name, config)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, styleId, type, name, config]);

    const newStyle = styleResult.rows[0];

    // 記錄活動日誌
    await query(`
      INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
      VALUES ($1, 'create_style', 'style', $2, $3)
    `, [userId, styleId, JSON.stringify({ type, name })]);

    // 通知前端更新
    const userResult = await query('SELECT user_id FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length > 0) {
      SocketEmitter.emitStyleUpdate(io, userResult.rows[0].user_id, {
        action: 'created',
        style: {
          id: newStyle.style_id,
          type: newStyle.type,
          name: newStyle.name,
          config: newStyle.config
        }
      });
    }

    logger.info(`樣式已建立: ${styleId} (${type}) - User: ${req.user!.userCode}`);

    res.status(201).json({
      success: true,
      message: 'Style created successfully',
      data: {
        id: newStyle.style_id,
        type: newStyle.type,
        name: newStyle.name,
        config: newStyle.config,
        createdAt: newStyle.created_at,
        updatedAt: newStyle.updated_at
      }
    });

  } catch (error) {
    logger.error('Create style error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create style'
    });
  }
});

// 更新樣式
router.put('/:styleId', [
  authenticateToken,
  param('styleId').notEmpty().withMessage('Style ID is required'),
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('config').optional().isObject().withMessage('Config must be an object')
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
    const { styleId } = req.params;
    const { name, config } = req.body;

    // 檢查樣式是否存在
    const existingStyle = await query(`
      SELECT type FROM styles 
      WHERE user_id = $1 AND style_id = $2 AND is_active = true
    `, [userId, styleId]);

    if (existingStyle.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Style not found'
      });
    }

    // 驗證設定格式
    if (config) {
      const validationError = validateStyleConfig(existingStyle.rows[0].type, config);
      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError
        });
      }
    }

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = ${paramIndex++}`);
      updateValues.push(name);
    }
    if (config !== undefined) {
      updateFields.push(`config = ${paramIndex++}`);
      updateValues.push(config);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(userId, styleId);

    const updatedStyle = await query(`
      UPDATE styles 
      SET ${updateFields.join(', ')}
      WHERE user_id = ${paramIndex++} AND style_id = ${paramIndex++}
      RETURNING *
    `, updateValues);

    // 記錄活動日誌
    await query(`
      INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
      VALUES ($1, 'update_style', 'style', $2, $3)
    `, [userId, styleId, JSON.stringify({ name, config })]);

    // 通知前端更新
    const userResult = await query('SELECT user_id FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length > 0) {
      const style = updatedStyle.rows[0];
      SocketEmitter.emitStyleUpdate(io, userResult.rows[0].user_id, {
        action: 'updated',
        style: {
          id: style.style_id,
          type: style.type,
          name: style.name,
          config: style.config
        }
      });
    }

    logger.info(`樣式已更新: ${styleId} - User: ${req.user!.userCode}`);

    const style = updatedStyle.rows[0];
    res.json({
      success: true,
      message: 'Style updated successfully',
      data: {
        id: style.style_id,
        type: style.type,
        name: style.name,
        config: style.config,
        createdAt: style.created_at,
        updatedAt: style.updated_at
      }
    });

  } catch (error) {
    logger.error('Update style error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update style'
    });
  }
});

// 刪除樣式
router.delete('/:styleId', [
  authenticateToken,
  param('styleId').notEmpty().withMessage('Style ID is required')
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
    const { styleId } = req.params;

    // 軟刪除樣式
    const deleteResult = await query(`
      UPDATE styles 
      SET is_active = false, updated_at = NOW()
      WHERE user_id = $1 AND style_id = $2 AND is_active = true
      RETURNING type, name
    `, [userId, styleId]);

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Style not found'
      });
    }

    // 記錄活動日誌
    await query(`
      INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
      VALUES ($1, 'delete_style', 'style', $2, $3)
    `, [userId, styleId, JSON.stringify(deleteResult.rows[0])]);

    // 通知前端更新
    const userResult = await query('SELECT user_id FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length > 0) {
      SocketEmitter.emitStyleUpdate(io, userResult.rows[0].user_id, {
        action: 'deleted',
        styleId: styleId
      });
    }

    logger.info(`樣式已刪除: ${styleId} - User: ${req.user!.userCode}`);

    res.json({
      success: true,
      message: 'Style deleted successfully'
    });

  } catch (error) {
    logger.error('Delete style error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete style'
    });
  }
});

// 複製樣式
router.post('/:styleId/duplicate', [
  authenticateToken,
  param('styleId').notEmpty().withMessage('Style ID is required'),
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters')
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
    const { styleId } = req.params;
    const { name } = req.body;

    // 取得原始樣式
    const originalStyle = await query(`
      SELECT type, name, config FROM styles 
      WHERE user_id = $1 AND style_id = $2 AND is_active = true
    `, [userId, styleId]);

    if (originalStyle.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Original style not found'
      });
    }

    const original = originalStyle.rows[0];
    const newStyleId = generateStyleId();
    const duplicateName = name || `${original.name} (複製)`;

    // 建立複製的樣式
    const duplicateResult = await query(`
      INSERT INTO styles (user_id, style_id, type, name, config)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, newStyleId, original.type, duplicateName, original.config]);

    const newStyle = duplicateResult.rows[0];

    // 記錄活動日誌
    await query(`
      INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
      VALUES ($1, 'duplicate_style', 'style', $2, $3)
    `, [userId, newStyleId, JSON.stringify({ originalId: styleId, newName: duplicateName })]);

    logger.info(`樣式已複製: ${styleId} -> ${newStyleId} - User: ${req.user!.userCode}`);

    res.status(201).json({
      success: true,
      message: 'Style duplicated successfully',
      data: {
        id: newStyle.style_id,
        type: newStyle.type,
        name: newStyle.name,
        config: newStyle.config,
        createdAt: newStyle.created_at,
        updatedAt: newStyle.updated_at
      }
    });

  } catch (error) {
    logger.error('Duplicate style error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate style'
    });
  }
});

// 生成樣式 ID
function generateStyleId(): string {
  const prefix = 'style';
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}-${timestamp}-${random}`;
}

// 驗證樣式設定
function validateStyleConfig(type: string, config: any): string | null {
  if (!config || typeof config !== 'object') {
    return 'Config must be an object';
  }

  switch (type) {
    case 'chat':
      return validateChatConfig(config);
    case 'donation':
      return validateDonationConfig(config);
    case 'clock':
      return validateClockConfig(config);
    case 'loading':
      return validateLoadingConfig(config);
    default:
      return 'Invalid style type';
  }
}

function validateChatConfig(config: any): string | null {
  const required = ['fontFamily', 'fontSize', 'fontColor'];
  for (const field of required) {
    if (!(field in config)) {
      return `Missing required field: ${field}`;
    }
  }

  if (typeof config.fontSize !== 'number' || config.fontSize < 8 || config.fontSize > 72) {
    return 'Font size must be between 8 and 72';
  }

  if (config.maxMessages && (typeof config.maxMessages !== 'number' || config.maxMessages < 1 || config.maxMessages > 50)) {
    return 'Max messages must be between 1 and 50';
  }

  return null;
}

function validateDonationConfig(config: any): string | null {
  const required = ['fontFamily', 'fontSize', 'fontColor', 'progressColor'];
  for (const field of required) {
    if (!(field in config)) {
      return `Missing required field: ${field}`;
    }
  }

  if (typeof config.fontSize !== 'number' || config.fontSize < 8 || config.fontSize > 72) {
    return 'Font size must be between 8 and 72';
  }

  if (config.height && (typeof config.height !== 'number' || config.height < 10 || config.height > 100)) {
    return 'Height must be between 10 and 100';
  }

  return null;
}

function validateClockConfig(config: any): string | null {
  const required = ['fontFamily', 'fontSize', 'fontColor'];
  for (const field of required) {
    if (!(field in config)) {
      return `Missing required field: ${field}`;
    }
  }

  if (typeof config.fontSize !== 'number' || config.fontSize < 8 || config.fontSize > 200) {
    return 'Font size must be between 8 and 200';
  }

  return null;
}

function validateLoadingConfig(config: any): string | null {
  const required = ['type', 'color'];
  for (const field of required) {
    if (!(field in config)) {
      return `Missing required field: ${field}`;
    }
  }

  const validTypes = ['spinner', 'dots', 'progress'];
  if (!validTypes.includes(config.type)) {
    return `Invalid loading type. Must be one of: ${validTypes.join(', ')}`;
  }

  if (config.size && (typeof config.size !== 'number' || config.size < 20 || config.size > 200)) {
    return 'Size must be between 20 and 200';
  }

  return null;
}

export default router;