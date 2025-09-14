import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

let redisClient: RedisClientType | null = null;

export async function connectRedis(): Promise<void> {
  try {
    // Redis 連線設定
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 10000,
        lazyConnect: true,
        keepAlive: true,
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            logger.error('Redis 重連次數超過限制，停止重連');
            return false;
          }
          const delay = Math.min(retries * 50, 500);
          logger.warn(`Redis 重連嘗試 #${retries}，${delay}ms 後重試`);
          return delay;
        }
      }
    });

    // 錯誤處理
    redisClient.on('error', (err) => {
      logger.error('Redis 連線錯誤:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis 開始連線...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis 連線就緒');
    });

    redisClient.on('end', () => {
      logger.warn('Redis 連線已斷開');
    });

    // 建立連線
    await redisClient.connect();
    
    // 測試連線
    await redisClient.ping();
    
    logger.info('Redis 連線建立成功');
    
  } catch (error) {
    logger.warn('Redis 連線失敗，系統將在沒有快取的情況下運行:', error);
    redisClient = null;
  }
}

// 取得 Redis 客戶端
export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

// 快取操作封裝
export class CacheService {
  // 設定快取
  static async set(key: string, value: any, expirationInSeconds?: number): Promise<void> {
    if (!redisClient) {
      logger.debug('Redis 不可用，跳過快取設定');
      return;
    }

    try {
      const serializedValue = JSON.stringify(value);
      if (expirationInSeconds) {
        await redisClient.setEx(key, expirationInSeconds, serializedValue);
      } else {
        await redisClient.set(key, serializedValue);
      }
      logger.debug(`快取已設定: ${key}`);
    } catch (error) {
      logger.error('設定快取失敗:', error);
    }
  }

  // 取得快取
  static async get<T>(key: string): Promise<T | null> {
    if (!redisClient) {
      logger.debug('Redis 不可用，跳過快取取得');
      return null;
    }

    try {
      const value = await redisClient.get(key);
      if (value === null) {
        logger.debug(`快取未命中: ${key}`);
        return null;
      }
      
      logger.debug(`快取命中: ${key}`);
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('取得快取失敗:', error);
      return null;
    }
  }

  // 刪除快取
  static async delete(key: string): Promise<void> {
    if (!redisClient) {
      logger.debug('Redis 不可用，跳過快取刪除');
      return;
    }

    try {
      await redisClient.del(key);
      logger.debug(`快取已刪除: ${key}`);
    } catch (error) {
      logger.error('刪除快取失敗:', error);
    }
  }

  // 檢查快取是否存在
  static async exists(key: string): Promise<boolean> {
    if (!redisClient) {
      return false;
    }

    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('檢查快取存在性失敗:', error);
      return false;
    }
  }

  // 設定快取過期時間
  static async expire(key: string, seconds: number): Promise<void> {
    if (!redisClient) {
      return;
    }

    try {
      await redisClient.expire(key, seconds);
      logger.debug(`快取過期時間已設定: ${key} - ${seconds}秒`);
    } catch (error) {
      logger.error('設定快取過期時間失敗:', error);
    }
  }

  // 清除所有快取
  static async flushAll(): Promise<void> {
    if (!redisClient) {
      logger.debug('Redis 不可用，跳過清除所有快取');
      return;
    }

    try {
      await redisClient.flushAll();
      logger.info('所有快取已清除');
    } catch (error) {
      logger.error('清除所有快取失敗:', error);
    }
  }

  // 取得所有符合模式的鍵
  static async keys(pattern: string): Promise<string[]> {
    if (!redisClient) {
      return [];
    }

    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      logger.error('取得快取鍵失敗:', error);
      return [];
    }
  }
}

// 優雅關閉
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis 連線已關閉');
    } catch (error) {
      logger.error('關閉 Redis 連線失敗:', error);
    }
  }
}