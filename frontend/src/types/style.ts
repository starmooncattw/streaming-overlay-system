import { Timestamp } from 'firebase/firestore';

export interface ChatStyle {
  id: string;
  userId: string;
  name: string;
  displayMode: 'horizontal' | 'dialog' | 'danmaku' | 'notebook';
  
  font: {
    family: string;
    size: number;
    weight: 'normal' | 'bold' | 'lighter';
    color: string;
  };
  
  background: {
    color: string;
    opacity: number;
    blur: number;
  };
  
  animation: {
    enabled: boolean;
    type: 'fade' | 'slide' | 'bounce' | 'none';
    duration: number;
    entrance?: string;
    delay?: number;
  };
  
  layout: {
    padding: number;
    borderRadius: number;
    alignment: 'left' | 'center' | 'right';
    maxWidth: number;
    margin?: number;
  };
  
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  platform: 'youtube' | 'twitch' | 'test';
  timestamp: Date; // 改為 Date 類型
  avatar?: string;
}

// 樣式模板
export const styleTemplates: Partial<ChatStyle>[] = [
  {
    name: '經典樣式',
    displayMode: 'horizontal',
    font: { family: 'Arial', size: 16, weight: 'normal', color: '#ffffff' },
    background: { color: '#000000', opacity: 0.7, blur: 0 },
    animation: { enabled: true, type: 'fade', duration: 500 },
    layout: { padding: 10, borderRadius: 5, alignment: 'left', maxWidth: 400, margin: 10 }
  },
  {
    name: '現代樣式',
    displayMode: 'dialog',
    font: { family: 'Roboto', size: 18, weight: 'normal', color: '#ffffff' },
    background: { color: '#1a1a1a', opacity: 0.8, blur: 5 },
    animation: { enabled: true, type: 'slide', duration: 300 },
    layout: { padding: 15, borderRadius: 10, alignment: 'left', maxWidth: 500, margin: 15 }
  },
  {
    name: '彈幕風格',
    displayMode: 'danmaku',
    font: { family: 'Microsoft JhengHei', size: 20, weight: 'bold', color: '#00ff00' },
    background: { color: '#000000', opacity: 0.5, blur: 0 },
    animation: { enabled: true, type: 'slide', duration: 800 },
    layout: { padding: 8, borderRadius: 3, alignment: 'center', maxWidth: 600, margin: 8 }
  },
  {
    name: '筆記本風格',
    displayMode: 'notebook',
    font: { family: 'Courier New', size: 14, weight: 'normal', color: '#333333' },
    background: { color: '#ffffcc', opacity: 0.9, blur: 2 },
    animation: { enabled: true, type: 'fade', duration: 400 },
    layout: { padding: 20, borderRadius: 8, alignment: 'left', maxWidth: 450, margin: 20 }
  }
];
