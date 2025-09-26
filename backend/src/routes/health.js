const express = require('express');
const router = express.Router();

/**
 * 健康檢查端點
 * 用於 GCP App Engine 和負載均衡器的健康檢查
 */
router.get('/', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };
  
  try {
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.message = error.message;
    res.status(503).json(healthCheck);
  }
});

/**
 * 詳細健康檢查端點
 * 提供更詳細的系統狀態資訊
 */
router.get('/detailed', (req, res) => {
  const detailedHealth = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
    },
    cpu: {
      usage: process.cpuUsage()
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    }
  };
  
  res.status(200).json(detailedHealth);
});

/**
 * 準備就緒檢查端點
 * 檢查應用是否準備好接收流量
 */
router.get('/ready', (req, res) => {
  // 這裡可以添加更複雜的準備就緒檢查邏輯
  // 例如：資料庫連接、外部服務可用性等
  
  const readinessCheck = {
    status: 'ready',
    timestamp: new Date().toISOString(),
    checks: {
      server: 'ok',
      // database: 'ok', // 未來可添加資料庫檢查
      // externalServices: 'ok' // 未來可添加外部服務檢查
    }
  };
  
  res.status(200).json(readinessCheck);
});

/**
 * 存活檢查端點
 * 檢查應用是否仍在運行
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
