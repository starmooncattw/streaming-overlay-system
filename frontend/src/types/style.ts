// 樣式管理系統的型別定義
export interface ChatStyle {
  id: string;
  userId: string;
  name: string;
  displayMode: 'horizontal' | 'dialog' | 'danmaku' | 'notebook';
  
  // 字體設定
  font: {
    family: string;
    size: number;
    weight: 'normal' | 'bold' | 'lighter';
    color: string;
  };
  
  // 背景設定
  background: {
    color: string;
    opacity: number;
    blur: number;
  };
  
  // 動畫效果
  animation?: {
    entrance: 'fade' | 'slide' | 'bounce' | 'none';
    duration: number;
    delay: number;
  };
  
  // 佈局設定
  layout: {
    padding: number;
    margin: number;
    borderRadius: number;
    maxWidth?: number;
    alignment: 'left' | 'center' | 'right';
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// 預設樣式配置
export const defaultChatStyle: Omit<ChatStyle, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  name: '預設樣式',
  displayMode: 'horizontal',
  font: {
    family: 'Arial, sans-serif',
    size: 16,
    weight: 'normal',
    color: '#FFFFFF'
  },
  background: {
    color: '#000000',
    opacity: 0.7,
    blur: 0
  },
  animation: {
    entrance: 'fade',
    duration: 300,
    delay: 0
  },
  layout: {
    padding: 12,
    margin: 8,
    borderRadius: 4,
    maxWidth: 400,
    alignment: 'left'
  }
};

// 聊天訊息介面
export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  platform?: 'youtube' | 'twitch' | 'test';
  color?: string;
  badges?: string[];
}

// 樣式預設模板
export const styleTemplates: Partial<ChatStyle>[] = [
  {
    name: '經典風格',
    displayMode: 'horizontal',
    font: { family: 'Arial, sans-serif', size: 16, weight: 'normal', color: '#FFFFFF' },
    background: { color: '#000000', opacity: 0.7, blur: 0 },
    layout: { padding: 12, margin: 8, borderRadius: 4, maxWidth: 400, alignment: 'left' }
  },
  {
    name: '現代風格',
    displayMode: 'dialog',
    font: { family: 'Roboto, sans-serif', size: 18, weight: 'normal', color: '#FFFFFF' },
    background: { color: '#1a1a2e', opacity: 0.9, blur: 10 },
    layout: { padding: 16, margin: 12, borderRadius: 12, maxWidth: 500, alignment: 'left' }
  },
  {
    name: '彈幕風格',
    displayMode: 'danmaku',
    font: { family: 'Microsoft JhengHei, sans-serif', size: 20, weight: 'bold', color: '#00FF00' },
    background: { color: '#000000', opacity: 0.5, blur: 0 },
    layout: { padding: 8, margin: 4, borderRadius: 20, maxWidth: 300, alignment: 'center' }
  },
  {
    name: '筆記本風格',
    displayMode: 'notebook',
    font: { family: 'Courier New, monospace', size: 14, weight: 'normal', color: '#333333' },
    background: { color: '#FFFFFF', opacity: 0.95, blur: 5 },
    layout: { padding: 20, margin: 10, borderRadius: 8, maxWidth: 600, alignment: 'left' }
  }
];
