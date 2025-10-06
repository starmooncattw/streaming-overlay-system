const rateLimit = require('express-rate-limit');
const { logger } = require('./errorHandler');

/**
 * 基本速率限制配置
 * 適用於一般 API 請求
 */
const basicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 限制每個 IP 在 windowMs 內最多 100 個請求
  message: {
    error: '請求過於頻繁，請稍後再試',
    retryAfter: '15 分鐘'
  },
  standardHeaders: true, // 返回速率限制資訊在 `RateLimit-*` headers
  legacyHeaders: false, // 禁用 `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn({
      message: '速率限制觸發',
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: '請求過於頻繁，請稍後再試',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

/**
 * 嚴格速率限制配置
 * 適用於敏感操作如登入、註冊
 */
const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 5, // 限制每個 IP 在 windowMs 內最多 5 個請求
  message: {
    error: '敏感操作請求過於頻繁，請稍後再試',
    retryAfter: '15 分鐘'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 成功的請求不計入限制
  handler: (req, res) => {
    logger.warn({
      message: '嚴格速率限制觸發',
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: '敏感操作請求過於頻繁，請稍後再試',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

/**
 * 寬鬆速率限制配置
 * 適用於公開 API 或讀取操作
 */
const lenientRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 1000, // 限制每個 IP 在 windowMs 內最多 1000 個請求
  message: {
    error: '請求過於頻繁，請稍後再試',
    retryAfter: '15 分鐘'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      message: '寬鬆速率限制觸發',
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: '請求過於頻繁，請稍後再試',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

/**
 * 上傳專用速率限制配置
 * 適用於檔案上傳操作
 */
const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小時
  max: 10, // 限制每個 IP 在 1 小時內最多 10 次上傳
  message: {
    error: '上傳請求過於頻繁，請稍後再試',
    retryAfter: '1 小時'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      message: '上傳速率限制觸發',
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: '上傳請求過於頻繁，請稍後再試',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

/**
 * WebSocket 連接速率限制
 * 適用於 Socket.IO 連接
 */
const websocketRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 分鐘
  max: 30, // 限制每個 IP 在 1 分鐘內最多 30 次 WebSocket 連接嘗試
  message: {
    error: 'WebSocket 連接請求過於頻繁',
    retryAfter: '1 分鐘'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      message: 'WebSocket 速率限制觸發',
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'WebSocket 連接請求過於頻繁，請稍後再試',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

/**
 * 動態速率限制中介軟體
 * 根據用戶類型或 API 金鑰調整限制
 */
const dynamicRateLimit = (req, res, next) => {
  // 檢查是否有 API 金鑰或認證令牌
  const hasApiKey = req.headers['x-api-key'];
  const hasAuthToken = req.headers.authorization;
  
  if (hasApiKey || hasAuthToken) {
    // 已認證用戶使用寬鬆限制
    return lenientRateLimit(req, res, next);
  } else {
    // 未認證用戶使用基本限制
    return basicRateLimit(req, res, next);
  }
};

module.exports = {
  basicRateLimit,
  strictRateLimit,
  lenientRateLimit,
  uploadRateLimit,
  websocketRateLimit,
  dynamicRateLimit
};

// 預設導出基本速率限制
module.exports.default = basicRateLimit;
