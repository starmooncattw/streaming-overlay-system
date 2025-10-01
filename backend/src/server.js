const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

// 路由導入
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const healthRoutes = require('./routes/health');
const youtubeRoutes = require('./routes/youtube');

// 中介軟體導入
const { errorHandler } = require('./middleware/errorHandler');
const { basicRateLimit } = require('./middleware/rateLimiter');

// Socket.IO 設定
const { createServer } = require('http');
const { Server } = require('socket.io');

// 建立 Express 應用
const app = express();
const server = createServer(app);

// Socket.IO 初始化
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// 基本中介軟體
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

app.use(compression());
app.use(morgan('combined'));
app.use(cookieParser());

// CORS 設定
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 解析請求體
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 速率限制
app.use('/api/', basicRateLimit);

// 靜態文件服務 (生產環境)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
}

// API 路由
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api', apiRoutes);

// Socket.IO 連接處理
io.on('connection', (socket) => {
  console.log(`用戶連接: ${socket.id}`);
  
  // 加入直播間
  socket.on('join-stream', (streamerId) => {
    socket.join(`stream-${streamerId}`);
    console.log(`用戶 ${socket.id} 加入直播間: ${streamerId}`);
  });
  
  // 離開直播間
  socket.on('leave-stream', (streamerId) => {
    socket.leave(`stream-${streamerId}`);
    console.log(`用戶 ${socket.id} 離開直播間: ${streamerId}`);
  });
  
  // 斷線處理
  socket.on('disconnect', () => {
    console.log(`用戶斷線: ${socket.id}`);
  });
});

// 將 io 實例附加到 app，供其他模組使用
app.set('io', io);

// 生產環境前端路由處理
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
  });
}

// 錯誤處理中介軟體
app.use(errorHandler);

// 啟動服務器
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 服務器運行在端口 ${PORT}`);
  console.log(`📱 前端 URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔧 環境: ${process.env.NODE_ENV || 'development'}`);
});

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在關閉服務器...');
  server.close(() => {
    console.log('服務器已關閉');
    process.exit(0);
  });
});

module.exports = { app, server, io };
