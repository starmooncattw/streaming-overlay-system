import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// 配置和服務
import { logger } from './config/logger';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { initializeFirebase } from './config/firebase';

// 路由
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import styleRoutes from './routes/style';
import displayRoutes from './routes/display';
import settingsRoutes from './routes/settings';
import testRoutes from './routes/test';

// 中間件
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Socket 服務
import { initializeSocket } from './services/socketService';

// 載入環境變數
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 5000;

// 基礎中間件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:", "https:"]
    }
  }
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    /\.vercel\.app$/,
    /localhost:\d+$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));

app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: process.env.NODE_ENV === 'production' ? 200 : 1000, // 生產環境較嚴格
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 跳過內部健康檢查
    return req.path === '/health' || req.path === '/ping';
  }
});

app.use('/api', limiter);

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/styles', styleRoutes);
app.use('/api/display', displayRoutes);
app.use('/api/settings', settingsRoutes);

// 測試路由（僅開發環境）
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRoutes);
}

// Socket.IO 初始化
initializeSocket(io);

// 錯誤處理中間件
app.use(notFound);
app.use(errorHandler);

// 優雅關閉處理
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // 強制關閉超時
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未處理的異常
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// 啟動服務
async function startServer() {
  try {
    // 初始化服務
    logger.info('Initializing services...');
    
    await connectDatabase();
    logger.info('Database connected successfully');
    
    await connectRedis();
    logger.info('Redis connected successfully');
    
    await initializeFirebase();
    logger.info('Firebase initialized successfully');
    
    // 啟動伺服器
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      logger.info(`📡 Socket.IO initialized`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 啟動
startServer();

export { app, server, io };