import { Pool, PoolConfig } from 'pg';
import { logger } from './logger';

let pool: Pool;

const databaseConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // 最大連接數
  min: 2,  // 最小連接數
  idleTimeoutMillis: 30000, // 連接閒置超時
  connectionTimeoutMillis: 10000, // 連接超時
};

export async function connectDatabase(): Promise<void> {
  try {
    pool = new Pool(databaseConfig);
    
    // 測試連接
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    logger.info('Database connection established successfully');
    
    // 初始化資料庫結構
    await initializeDatabase();
    
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database structure...');
    
    // 建立 users 表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(100),
        avatar_url TEXT,
        google_id VARCHAR(100) UNIQUE,
        last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true
      );
    `);

    // 建立 styles 表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS styles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        style_id VARCHAR(50) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('chat', 'donation', 'clock', 'loading')),
        name VARCHAR(100) NOT NULL,
        config JSONB NOT NULL DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, style_id)
      );
    `);

    // 建立 chat_messages 表（測試用）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        platform VARCHAR(20) DEFAULT 'manual' CHECK (platform IN ('manual', 'youtube', 'twitch')),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_test BOOLEAN DEFAULT true
      );
    `);

    // 建立 donation_progress 表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS donation_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        goal_amount INTEGER NOT NULL DEFAULT 0,
        current_amount INTEGER NOT NULL DEFAULT 0,
        goal_title VARCHAR(200),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 建立 user_settings 表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        language VARCHAR(10) DEFAULT 'zh-TW' CHECK (language IN ('zh-TW', 'en')),
        theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
        timezone VARCHAR(50) DEFAULT 'Asia/Taipei',
        notifications JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 建立 activity_logs 表（日誌記錄）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL,
        resource_type VARCHAR(50),
        resource_id VARCHAR(100),
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 建立索引以提升查詢性能
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
      CREATE INDEX IF NOT EXISTS idx_styles_user_id ON styles(user_id);
      CREATE INDEX IF NOT EXISTS idx_styles_type ON styles(type);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_donation_progress_user_id ON donation_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
    `);

    // 插入預設樣式模板
    await pool.query(`
      INSERT INTO styles (user_id, style_id, type, name, config) VALUES
      -- 預設聊天室樣式
      ((SELECT id FROM users LIMIT 1), 'default-chat-1', 'chat', '預設聊天樣式', '{
        "fontFamily": "Arial",
        "fontSize": 16,
        "fontColor": "#FFFFFF",
        "backgroundColor": "rgba(0,0,0,0.7)",
        "borderRadius": 8,
        "padding": 12,
        "maxMessages": 10,
        "animationType": "slide",
        "position": "bottom-left"
      }'),
      -- 預設斗內進度軸樣式
      ((SELECT id FROM users LIMIT 1), 'default-donation-1', 'donation', '預設進度軸', '{
        "fontFamily": "Arial",
        "fontSize": 18,
        "fontColor": "#FFFFFF",
        "progressColor": "#FFA24B",
        "backgroundColor": "rgba(0,0,0,0.5)",
        "borderRadius": 20,
        "height": 30,
        "showPercentage": true,
        "animationDuration": 1000
      }'),
      -- 預設時鐘樣式
      ((SELECT id FROM users LIMIT 1), 'default-clock-1', 'clock', '數位時鐘', '{
        "fontFamily": "Digital",
        "fontSize": 48,
        "fontColor": "#00FF00",
        "format": "HH:mm:ss",
        "showDate": false,
        "glowEffect": true
      }'),
      -- 預設 Loading 樣式
      ((SELECT id FROM users LIMIT 1), 'default-loading-1', 'loading', '旋轉載入', '{
        "type": "spinner",
        "color": "#FFA24B",
        "size": 60,
        "text": "載入中...",
        "fontFamily": "Arial",
        "fontSize": 16
      }')
      ON CONFLICT (user_id, style_id) DO NOTHING;
    `);

    logger.info('Database structure initialized successfully');
    
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

export async function query(text: string, params?: any[]): Promise<any> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      logger.warn(`Slow query detected: ${duration}ms`, { query: text });
    }
    
    return result;
  } catch (error) {
    logger.error('Database query error:', { error, query: text, params });
    throw error;
  }
}

export async function getClient() {
  return await pool.connect();
}

export { pool };