import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  setDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ChatStyle, defaultChatStyle } from '../types/style';
// 簡單的 UUID 生成器，避免依賴 uuid 包
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const styleService = {
  // 建立新樣式
  async createStyle(userId: string, styleData: Partial<ChatStyle>): Promise<ChatStyle> {
    try {
      const newStyle: ChatStyle = {
        id: generateId(),
        userId,
        ...defaultChatStyle,
        ...styleData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = doc(db, 'chatStyles', newStyle.id);
      await setDoc(docRef, {
        ...newStyle,
        createdAt: newStyle.createdAt.toISOString(),
        updatedAt: newStyle.updatedAt.toISOString()
      });

      return newStyle;
    } catch (error) {
      console.error('建立樣式失敗:', error);
      throw error;
    }
  },

  // 獲取使用者所有樣式
  async getStylesByUser(userId: string): Promise<ChatStyle[]> {
    try {
      const q = query(
        collection(db, 'chatStyles'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        } as ChatStyle;
      });
    } catch (error) {
      console.error('獲取樣式失敗:', error);
      throw error;
    }
  },

  // 獲取特定樣式
  async getStyleById(styleId: string): Promise<ChatStyle | null> {
    try {
      const docRef = doc(db, 'chatStyles', styleId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        } as ChatStyle;
      } else {
        return null;
      }
    } catch (error) {
      console.error('獲取樣式失敗:', error);
      throw error;
    }
  },

  // 更新樣式
  async updateStyle(styleId: string, updates: Partial<ChatStyle>): Promise<void> {
    try {
      const docRef = doc(db, 'chatStyles', styleId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('更新樣式失敗:', error);
      throw error;
    }
  },

  // 刪除樣式
  async deleteStyle(styleId: string): Promise<void> {
    try {
      const docRef = doc(db, 'chatStyles', styleId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('刪除樣式失敗:', error);
      throw error;
    }
  },

  // 複製樣式
  async duplicateStyle(styleId: string, newName: string, userId: string): Promise<ChatStyle> {
    try {
      const originalStyle = await this.getStyleById(styleId);
      if (!originalStyle) {
        throw new Error('找不到要複製的樣式');
      }

      const duplicatedStyle = {
        ...originalStyle,
        name: newName,
        id: generateId(),
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = doc(db, 'chatStyles', duplicatedStyle.id);
      await setDoc(docRef, {
        ...duplicatedStyle,
        createdAt: duplicatedStyle.createdAt.toISOString(),
        updatedAt: duplicatedStyle.updatedAt.toISOString()
      });

      return duplicatedStyle;
    } catch (error) {
      console.error('複製樣式失敗:', error);
      throw error;
    }
  },

  // 生成樣式 CSS
  generateStyleCSS(style: ChatStyle): string {
    return `
      .chat-message {
        font-family: ${style.font.family};
        font-size: ${style.font.size}px;
        font-weight: ${style.font.weight};
        color: ${style.font.color};
        background-color: ${style.background.color}${Math.round(style.background.opacity * 255).toString(16).length === 1 ? '0' + Math.round(style.background.opacity * 255).toString(16) : Math.round(style.background.opacity * 255).toString(16)};
        padding: ${style.layout.padding}px;
        margin: ${style.layout.margin}px;
        border-radius: ${style.layout.borderRadius}px;
        max-width: ${style.layout.maxWidth ? `${style.layout.maxWidth}px` : 'none'};
        text-align: ${style.layout.alignment};
        backdrop-filter: ${style.background.blur > 0 ? `blur(${style.background.blur}px)` : 'none'};
        animation: ${style.animation?.entrance || 'fade'} ${style.animation?.duration || 300}ms ease-out;
        animation-delay: ${style.animation?.delay || 0}ms;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
      }
      
      .chat-container.${style.displayMode} {
        display: flex;
        flex-direction: column;
        gap: ${style.layout.margin}px;
      }
      
      @keyframes fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slide {
        from { transform: translateX(-100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes bounce {
        0% { transform: scale(0.3); opacity: 0; }
        50% { transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
  }
};
