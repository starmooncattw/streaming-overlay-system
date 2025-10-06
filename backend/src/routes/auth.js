const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { asyncHandler, logger } = require('../middleware/errorHandler');
const { strictRateLimit } = require('../middleware/rateLimiter');

const router = express.Router();

// 應用嚴格速率限制到所有認證路由
router.use(strictRateLimit);

/**
 * 暫時的用戶資料存儲 (實際專案中應使用資料庫)
 * 這裡僅作為開發階段的模擬資料
 */
let users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'admin',
    streamerId: 'admin-stream-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    username: 'streamer1',
    email: 'streamer1@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'streamer',
    streamerId: 'streamer-001',
    createdAt: new Date().toISOString()
  }
];

/**
 * 生成 JWT Token
 */
const generateToken = (userId, role, streamerId) => {
  return jwt.sign(
    { 
      userId, 
      role, 
      streamerId,
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * 生成刷新令牌
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    { expiresIn: '30d' }
  );
};

/**
 * 用戶註冊
 * POST /api/auth/register
 */
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('用戶名必須在 3-20 個字符之間')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用戶名只能包含字母、數字和下劃線'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('請提供有效的電子郵件地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密碼至少需要 6 個字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密碼必須包含至少一個小寫字母、一個大寫字母和一個數字'),
  body('role')
    .optional()
    .isIn(['streamer', 'viewer', 'admin'])
    .withMessage('角色必須是 streamer、viewer 或 admin')
], asyncHandler(async (req, res) => {
  // 檢查驗證錯誤
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

  const { username, email, password, role = 'viewer' } = req.body;

  // 檢查用戶是否已存在
  const existingUser = users.find(user => 
    user.username === username || user.email === email
  );

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: {
        message: '用戶名或電子郵件已被使用'
      }
    });
  }

  // 加密密碼
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // 創建新用戶
  const newUser = {
    id: users.length + 1,
    username,
    email,
    password: hashedPassword,
    role,
    streamerId: role === 'streamer' ? `${username}-${Date.now()}` : null,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  // 生成令牌
  const token = generateToken(newUser.id, newUser.role, newUser.streamerId);
  const refreshToken = generateRefreshToken(newUser.id);

  logger.info({
    message: '用戶註冊成功',
    userId: newUser.id,
    username: newUser.username,
    role: newUser.role
  });

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        streamerId: newUser.streamerId,
        createdAt: newUser.createdAt
      },
      token,
      refreshToken
    }
  });
}));

/**
 * 用戶登入
 * POST /api/auth/login
 */
router.post('/login', [
  body('username')
    .notEmpty()
    .withMessage('用戶名或電子郵件為必填'),
  body('password')
    .notEmpty()
    .withMessage('密碼為必填')
], asyncHandler(async (req, res) => {
  // 檢查驗證錯誤
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

  const { username, password } = req.body;

  // 查找用戶 (支援用戶名或電子郵件登入)
  const user = users.find(u => 
    u.username === username || u.email === username
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        message: '用戶名或密碼錯誤'
      }
    });
  }

  // 驗證密碼
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: {
        message: '用戶名或密碼錯誤'
      }
    });
  }

  // 生成令牌
  const token = generateToken(user.id, user.role, user.streamerId);
  const refreshToken = generateRefreshToken(user.id);

  logger.info({
    message: '用戶登入成功',
    userId: user.id,
    username: user.username,
    role: user.role
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        streamerId: user.streamerId,
        createdAt: user.createdAt
      },
      token,
      refreshToken
    }
  });
}));

/**
 * 刷新令牌
 * POST /api/auth/refresh
 */
router.post('/refresh', [
  body('refreshToken')
    .notEmpty()
    .withMessage('刷新令牌為必填')
], asyncHandler(async (req, res) => {
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

  const { refreshToken } = req.body;

  try {
    // 驗證刷新令牌
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
    );

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: {
          message: '無效的刷新令牌'
        }
      });
    }

    // 查找用戶
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: '用戶不存在'
        }
      });
    }

    // 生成新的訪問令牌
    const newToken = generateToken(user.id, user.role, user.streamerId);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        message: '無效的刷新令牌'
      }
    });
  }
}));

/**
 * 獲取當前用戶資訊
 * GET /api/auth/me
 */
router.get('/me', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: '未提供認證令牌'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = users.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: '用戶不存在'
        }
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          streamerId: user.streamerId,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        message: '無效的認證令牌'
      }
    });
  }
}));

/**
 * 用戶登出
 * POST /api/auth/logout
 */
router.post('/logout', asyncHandler(async (req, res) => {
  // 在實際應用中，這裡應該將令牌加入黑名單
  // 或者從資料庫中移除刷新令牌
  
  logger.info({
    message: '用戶登出',
    ip: req.ip
  });

  res.json({
    success: true,
    data: {
      message: '登出成功'
    }
  });
}));

/**
 * 修改密碼
 * PUT /api/auth/change-password
 */
router.put('/change-password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('當前密碼為必填'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('新密碼至少需要 6 個字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('新密碼必須包含至少一個小寫字母、一個大寫字母和一個數字')
], asyncHandler(async (req, res) => {
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

  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: '未提供認證令牌'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userIndex = users.findIndex(u => u.id === decoded.userId);

    if (userIndex === -1) {
      return res.status(401).json({
        success: false,
        error: {
          message: '用戶不存在'
        }
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = users[userIndex];

    // 驗證當前密碼
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: {
          message: '當前密碼錯誤'
        }
      });
    }

    // 加密新密碼
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 更新密碼
    users[userIndex].password = hashedNewPassword;

    logger.info({
      message: '用戶修改密碼成功',
      userId: user.id,
      username: user.username
    });

    res.json({
      success: true,
      data: {
        message: '密碼修改成功'
      }
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        message: '無效的認證令牌'
      }
    });
  }
}));

module.exports = router;
