import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// 處理 404 Not Found 的中間件
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  // 記錄未找到的路由
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer')
  });

  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'Not Found',
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};