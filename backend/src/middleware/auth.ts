import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { logger } from '../config/logger';
import { AuthenticatedRequest } from '../types/auth';

// JWT Token 驗證中間件
export const authenticateToken = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    // 驗證 JWT Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // 檢查 token 內容
    if (!decoded.userId || !decoded.userCode) {
      res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
      return;
    }

    // 檢查使用者是否存在且活躍
    const userResult = await query(
      'SELECT id, user_id, email, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
      return;
    }

    // 將使用者資訊添加到請求物件
    req.user = {
      userId: user.id,
      userCode: user.user_id,
      email: user.email
    };

    // 記錄 API 存取日誌
    logger.debug(`API 存取: ${req.method} ${req.path} - User: ${user.user_id}`);

    next();

  } catch (error: any) {
    logger.error('Token 驗證失敗:', error);

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// 可選的身份驗證中間件（允許未登入用戶訪問）
export const optionalAuth = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // 沒有 token，繼續處理但不設定使用者資訊
      req.user = null;
      next();
      return;
    }

    // 有 token，嘗試驗證
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      if (decoded.userId && decoded.userCode) {
        const userResult = await query(
          'SELECT id, user_id, email, is_active FROM users WHERE id = $1 AND is_active = true',
          [decoded.userId]
        );

        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          req.user = {
            userId: user.id,
            userCode: user.user_id,
            email: user.email
          };
        }
      }
    } catch (tokenError) {
      // Token 無效，但繼續處理
      logger.debug('可選身份驗證中的 token 無效:', tokenError);
    }

    next();

  } catch (error) {
    logger.error('可選身份驗證中間件錯誤:', error);
    // 發生錯誤但不阻止請求繼續
    req.user = null;
    next();
  }
};

// 檢查用戶權限的中間件（未來可擴展）
export const requirePermission = (permission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // 目前系統只有單一權限，未來可以擴展
      // 可以從資料庫查詢用戶權限
      
      // 暫時所有已認證用戶都有所有權限
      next();

    } catch (error) {
      logger.error('權限檢查失敗:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

// 檢查用戶是否為資源擁有者
export const requireOwnership = (resourceUserIdField: string = 'userId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // 從路由參數或請求體中取得資源的擁有者 ID
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

      if (!resourceUserId) {
        res.status(400).json({
          success: false,
          message: 'Resource owner ID not provided'
        });
        return;
      }

      // 檢查是否為資源擁有者
      if (req.user.userCode !== resourceUserId) {
        res.status(403).json({
          success: false,
          message: 'Access denied: not the resource owner'
        });
        return;
      }

      next();

    } catch (error) {
      logger.error('資源擁有權檢查失敗:', error);
      res.status(500).json({
        success: false,
        message: 'Ownership check failed'
      });
    }
  };
};