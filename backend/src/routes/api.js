const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { asyncHandler, logger } = require('../middleware/errorHandler');
const { basicRateLimit, uploadRateLimit } = require('../middleware/rateLimiter');
const jwt = require('jsonwebtoken');

const router = express.Router();

// 應用基本速率限制到所有 API 路由
router.use(basicRateLimit);

/**
 * 認證中介軟體
 * 驗證 JWT Token 並提取用戶資訊
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: '未提供認證令牌'
      }
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          message: '無效的認證令牌'
        }
      });
    }

    req.user = user;
    next();
  });
};

/**
 * 角色驗證中介軟體
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: '未認證'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: '權限不足'
        }
      });
    }

    next();
  };
};

// ============================================================================
// 直播間管理 API
// ============================================================================

/**
 * 獲取直播間資訊
 * GET /api/streams/:streamerId
 */
router.get('/streams/:streamerId', asyncHandler(async (req, res) => {
  const { streamerId } = req.params;

  // 模擬直播間資料
  const streamData = {
    streamerId,
    title: `${streamerId} 的直播間`,
    description: '歡迎來到我的直播間！',
    isLive: Math.random() > 0.5, // 隨機模擬直播狀態
    viewerCount: Math.floor(Math.random() * 1000) + 10,
    startTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    category: 'Just Chatting',
    tags: ['中文', '聊天', '遊戲'],
    overlaySettings: {
      showDonations: true,
      showViewerCount: true,
      showLatestFollower: true,
      theme: 'dark'
    }
  };

  res.json({
    success: true,
    data: streamData
  });
}));

/**
 * 更新直播間設定
 * PUT /api/streams/:streamerId
 */
router.put('/streams/:streamerId', 
  authenticateToken,
  [
    body('title').optional().isLength({ min: 1, max: 100 }).withMessage('標題長度必須在 1-100 字符之間'),
    body('description').optional().isLength({ max: 500 }).withMessage('描述不能超過 500 字符'),
    body('category').optional().isLength({ min: 1, max: 50 }).withMessage('分類長度必須在 1-50 字符之間'),
    body('tags').optional().isArray().withMessage('標籤必須是陣列格式')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '驗證失敗',
          details: errors.array()
        }
      });
    }

    const { streamerId } = req.params;
    const updates = req.body;

    // 檢查權限：只有直播主本人或管理員可以更新
    if (req.user.streamerId !== streamerId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          message: '只能更新自己的直播間設定'
        }
      });
    }

    logger.info({
      message: '直播間設定更新',
      streamerId,
      userId: req.user.userId,
      updates
    });

    res.json({
      success: true,
      data: {
        message: '直播間設定更新成功',
        streamerId,
        updates
      }
    });
  })
);

// ============================================================================
// 斗內/捐贈管理 API
// ============================================================================

/**
 * 獲取斗內記錄
 * GET /api/donations/:streamerId
 */
router.get('/donations/:streamerId', 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('頁碼必須是正整數'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每頁數量必須在 1-100 之間'),
    query('startDate').optional().isISO8601().withMessage('開始日期格式錯誤'),
    query('endDate').optional().isISO8601().withMessage('結束日期格式錯誤')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '驗證失敗',
          details: errors.array()
        }
      });
    }

    const { streamerId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // 模擬斗內資料
    const donations = Array.from({ length: parseInt(limit) }, (_, i) => ({
      id: `donation-${Date.now()}-${i}`,
      donorName: `捐贈者${i + 1}`,
      amount: Math.floor(Math.random() * 1000) + 10,
      currency: 'TWD',
      message: `感謝直播主的精彩內容！這是第 ${i + 1} 筆捐贈`,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      isAnonymous: Math.random() > 0.7,
      platform: Math.random() > 0.5 ? 'youtube' : 'twitch'
    }));

    const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);

    res.json({
      success: true,
      data: {
        donations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(100 / limit), // 模擬總頁數
          totalItems: 100, // 模擬總數量
          itemsPerPage: parseInt(limit)
        },
        summary: {
          totalAmount,
          totalCount: donations.length,
          currency: 'TWD'
        }
      }
    });
  })
);

/**
 * 創建新的斗內記錄
 * POST /api/donations/:streamerId
 */
router.post('/donations/:streamerId',
  [
    body('donorName').notEmpty().withMessage('捐贈者名稱為必填'),
    body('amount').isFloat({ min: 1 }).withMessage('金額必須大於 0'),
    body('currency').isIn(['TWD', 'USD', 'EUR', 'JPY']).withMessage('不支援的貨幣類型'),
    body('message').optional().isLength({ max: 200 }).withMessage('訊息不能超過 200 字符'),
    body('isAnonymous').optional().isBoolean().withMessage('匿名設定必須是布林值')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '驗證失敗',
          details: errors.array()
        }
      });
    }

    const { streamerId } = req.params;
    const { donorName, amount, currency, message = '', isAnonymous = false } = req.body;

    const newDonation = {
      id: `donation-${Date.now()}`,
      streamerId,
      donorName: isAnonymous ? '匿名捐贈者' : donorName,
      amount,
      currency,
      message,
      timestamp: new Date().toISOString(),
      isAnonymous,
      platform: 'api' // 透過 API 創建的捐贈
    };

    // 透過 Socket.IO 即時廣播新的斗內
    const io = req.app.get('io');
    if (io) {
      io.to(`stream-${streamerId}`).emit('new-donation', newDonation);
    }

    logger.info({
      message: '新的斗內記錄創建',
      donationId: newDonation.id,
      streamerId,
      amount,
      currency
    });

    res.status(201).json({
      success: true,
      data: newDonation
    });
  })
);

// ============================================================================
// 即時統計 API
// ============================================================================

/**
 * 獲取直播間即時統計
 * GET /api/stats/:streamerId
 */
router.get('/stats/:streamerId', asyncHandler(async (req, res) => {
  const { streamerId } = req.params;

  // 模擬即時統計資料
  const stats = {
    streamerId,
    timestamp: new Date().toISOString(),
    viewers: {
      current: Math.floor(Math.random() * 1000) + 50,
      peak: Math.floor(Math.random() * 1500) + 100,
      total: Math.floor(Math.random() * 5000) + 500
    },
    donations: {
      todayTotal: Math.floor(Math.random() * 10000) + 1000,
      todayCount: Math.floor(Math.random() * 50) + 10,
      monthlyTotal: Math.floor(Math.random() * 100000) + 10000,
      currency: 'TWD'
    },
    engagement: {
      chatMessages: Math.floor(Math.random() * 1000) + 100,
      likes: Math.floor(Math.random() * 500) + 50,
      shares: Math.floor(Math.random() * 100) + 10
    },
    streamInfo: {
      duration: Math.floor(Math.random() * 14400) + 1800, // 30分鐘到4小時
      isLive: Math.random() > 0.3,
      quality: '1080p60',
      bitrate: Math.floor(Math.random() * 3000) + 2000
    }
  };

  res.json({
    success: true,
    data: stats
  });
}));

// ============================================================================
// 疊加層設定 API
// ============================================================================

/**
 * 獲取疊加層設定
 * GET /api/overlay/:streamerId
 */
router.get('/overlay/:streamerId', asyncHandler(async (req, res) => {
  const { streamerId } = req.params;

  // 模擬疊加層設定
  const overlayConfig = {
    streamerId,
    theme: 'dark',
    components: {
      donationAlert: {
        enabled: true,
        position: { x: 50, y: 20 },
        duration: 5000,
        minAmount: 10,
        sound: 'default',
        animation: 'slideIn'
      },
      viewerCount: {
        enabled: true,
        position: { x: 10, y: 10 },
        format: '觀看人數: {count}',
        updateInterval: 5000
      },
      latestFollower: {
        enabled: true,
        position: { x: 10, y: 90 },
        format: '最新關注: {username}',
        duration: 10000
      },
      chatBox: {
        enabled: false,
        position: { x: 70, y: 30 },
        maxMessages: 10,
        fontSize: 14
      },
      donationGoal: {
        enabled: true,
        position: { x: 30, y: 80 },
        target: 10000,
        current: 3500,
        currency: 'TWD'
      }
    },
    customCSS: '',
    lastUpdated: new Date().toISOString()
  };

  res.json({
    success: true,
    data: overlayConfig
  });
}));

/**
 * 更新疊加層設定
 * PUT /api/overlay/:streamerId
 */
router.put('/overlay/:streamerId',
  authenticateToken,
  [
    body('theme').optional().isIn(['light', 'dark', 'custom']).withMessage('主題必須是 light、dark 或 custom'),
    body('components').optional().isObject().withMessage('組件設定必須是物件格式'),
    body('customCSS').optional().isString().withMessage('自定義 CSS 必須是字串格式')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: '驗證失敗',
          details: errors.array()
        }
      });
    }

    const { streamerId } = req.params;
    const updates = req.body;

    // 檢查權限
    if (req.user.streamerId !== streamerId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          message: '只能更新自己的疊加層設定'
        }
      });
    }

    logger.info({
      message: '疊加層設定更新',
      streamerId,
      userId: req.user.userId,
      updates: Object.keys(updates)
    });

    res.json({
      success: true,
      data: {
        message: '疊加層設定更新成功',
        streamerId,
        updatedAt: new Date().toISOString()
      }
    });
  })
);

// ============================================================================
// WebHook 處理 API
// ============================================================================

/**
 * YouTube WebHook 處理
 * POST /api/webhooks/youtube
 */
router.post('/webhooks/youtube', asyncHandler(async (req, res) => {
  const payload = req.body;
  
  logger.info({
    message: 'YouTube WebHook 接收',
    payload
  });

  // 處理 YouTube 事件
  // 這裡應該根據不同的事件類型進行處理
  
  res.status(200).json({
    success: true,
    message: 'WebHook 處理成功'
  });
}));

/**
 * Twitch WebHook 處理
 * POST /api/webhooks/twitch
 */
router.post('/webhooks/twitch', asyncHandler(async (req, res) => {
  const payload = req.body;
  
  logger.info({
    message: 'Twitch WebHook 接收',
    payload
  });

  // 處理 Twitch 事件
  // 這裡應該根據不同的事件類型進行處理
  
  res.status(200).json({
    success: true,
    message: 'WebHook 處理成功'
  });
}));

// ============================================================================
// 檔案上傳 API
// ============================================================================

/**
 * 上傳頭像或疊加層圖片
 * POST /api/upload
 */
router.post('/upload',
  authenticateToken,
  uploadRateLimit,
  asyncHandler(async (req, res) => {
    // 這裡應該實現實際的檔案上傳邏輯
    // 例如使用 multer 中介軟體處理檔案上傳
    
    res.json({
      success: true,
      data: {
        message: '檔案上傳功能待實現',
        uploadUrl: 'https://example.com/uploads/placeholder.jpg'
      }
    });
  })
);

// ============================================================================
// 系統資訊 API
// ============================================================================

/**
 * 獲取系統狀態
 * GET /api/system/status
 */
router.get('/system/status', 
  authenticateToken,
  requireRole(['admin']),
  asyncHandler(async (req, res) => {
    const systemStatus = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'connected', // 模擬狀態
        redis: 'connected',
        youtube: 'connected',
        twitch: 'connected'
      }
    };

    res.json({
      success: true,
      data: systemStatus
    });
  })
);

module.exports = router;
