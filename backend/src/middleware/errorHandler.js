const winston = require('winston');

// 設定日誌記錄器
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'streaming-overlay-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// 在開發環境中也輸出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

/**
 * 全域錯誤處理中介軟體
 * 處理所有未捕獲的錯誤並返回適當的響應
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 記錄錯誤到日誌
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose 驗證錯誤
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      statusCode: 400,
      message: `驗證錯誤: ${message}`
    };
  }

  // Mongoose 重複鍵錯誤
  if (err.code === 11000) {
    const message = '資源已存在';
    error = {
      statusCode: 400,
      message
    };
  }

  // Mongoose 無效 ObjectId 錯誤
  if (err.name === 'CastError') {
    const message = '無效的資源 ID';
    error = {
      statusCode: 404,
      message
    };
  }

  // JWT 錯誤
  if (err.name === 'JsonWebTokenError') {
    const message = '無效的認證令牌';
    error = {
      statusCode: 401,
      message
    };
  }

  // JWT 過期錯誤
  if (err.name === 'TokenExpiredError') {
    const message = '認證令牌已過期';
    error = {
      statusCode: 401,
      message
    };
  }

  // 語法錯誤
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const message = '請求格式錯誤';
    error = {
      statusCode: 400,
      message
    };
  }

  // 設定預設錯誤
  const statusCode = error.statusCode || 500;
  const message = error.message || '服務器內部錯誤';

  // 在開發環境中返回錯誤堆疊
  const response = {
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  };

  res.status(statusCode).json(response);
};

/**
 * 處理 404 錯誤的中介軟體
 */
const notFound = (req, res, next) => {
  const error = new Error(`找不到路由 - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * 非同步錯誤處理包裝器
 * 用於包裝非同步路由處理器，自動捕獲錯誤
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  logger
};
