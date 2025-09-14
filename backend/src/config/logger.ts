import winston from 'winston';

// 定義日誌等級
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 定義日誌等級顏色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// 為 winston 添加顏色
winston.addColors(colors);

// 自訂格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// 定義要記錄哪些等級
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// 建立 logger 實例
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) => `${info.timestamp} [${info.level}]: ${info.message}`,
        ),
      ),
    }),
    // File transports (生產環境)
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.uncolorize(),
          winston.format.json(),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.uncolorize(),
          winston.format.json(),
        ),
      }),
    ] : []),
  ],
  // 處理未捕獲的例外
  exceptionHandlers: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({ filename: 'logs/exceptions.log' }),
    ] : []),
  ],
  // 處理未處理的 Promise rejection
  rejectionHandlers: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({ filename: 'logs/rejections.log' }),
    ] : []),
  ],
  exitOnError: false,
});

// 開發環境額外配置
if (process.env.NODE_ENV !== 'production') {
  logger.debug('Logger initialized in development mode');
}

export { logger };