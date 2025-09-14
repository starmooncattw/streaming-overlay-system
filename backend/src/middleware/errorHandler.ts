import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// 自訂錯誤類別
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 主要錯誤處理中間件
export const errorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  let error = { ...err } as any;
  error.message = err.message;

  // 記錄錯誤
  logger.error(`錯誤 ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // 處理不同類型的錯誤
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose 重複欄位錯誤
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // Mongoose 驗證錯誤
  if (err.name === 'ValidationError') {
    const message = 'Validation failed';
    error = new AppError(message, 400);
  }

  // JWT 錯誤
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401);
  }

  // PostgreSQL 錯誤處理
  if (err.name === 'DatabaseError' || (err as any).code) {
    error = handleDatabaseError(err as any);
  }

  // 發送錯誤回應
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      error: err,
      stack: err.stack
    })
  });
};

// 處理資料庫錯誤
function handleDatabaseError(err: any): AppError {
  let message = 'Database operation failed';
  let statusCode = 500;

  // PostgreSQL 錯誤代碼
  switch (err.code) {
    case '23505': // 違反唯一約束
      message = 'Duplicate entry found';
      statusCode = 409;
      break;
    case '23503': // 違反外鍵約束
      message = 'Referenced record not found';
      statusCode = 400;
      break;
    case '23502': // NOT NULL 違反
      message = 'Required field is missing';
      statusCode = 400;
      break;
    case '42703': // 未定義的欄位
      message = 'Invalid field specified';
      statusCode = 400;
      break;
    case '42P01': // 未定義的資料表
      message = 'Table not found';
      statusCode = 500;
      break;
    case '28P01': // 身份驗證失敗
      message = 'Database authentication failed';
      statusCode = 500;
      break;
    case 'ECONNREFUSED': // 連線被拒絕
      message = 'Database connection failed';
      statusCode = 500;
      break;
    default:
      // 其他資料庫錯誤
      if (err.message) {
        message = process.env.NODE_ENV === 'development' ? 
          err.message : 'Database operation failed';
      }
  }

  return new AppError(message, statusCode);
}

// 處理未捕獲的路由
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

// 非同步錯誤包裝器
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 驗證錯誤處理器
export const validationErrorHandler = (errors: any[]) => {
  const message = errors.map(err => err.msg).join(', ');
  return new AppError(`Validation Error: ${message}`, 400);
};

// Rate limit 錯誤處理
export const rateLimitHandler = (req: Request, res: Response): void => {
  logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
  
  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later',
    retryAfter: '15min'
  });
};