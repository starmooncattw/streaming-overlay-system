import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ChatStyle } from '../types/style';

class StyleService {
  private collectionName = 'styles';

  // 獲取用戶的所有樣式 - 使用簡單查詢
  async getStylesByUser(userId: string): Promise<ChatStyle[]> {
    try {
      // 簡化查詢，只按 userId 過濾
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const styles: ChatStyle[] = [];
      
      querySnapshot.forEach((doc) => {
        styles.push({
          id: doc.id,
          ...doc.data()
        } as ChatStyle);
      });
      
      // 在客戶端排序
      styles.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      
      return styles;
    } catch (error) {
      console.error('獲取樣式失敗:', error);
      return []; // 返回空數組而不是拋出錯誤
    }
  }

  // 創建新樣式
  async createStyle(userId: string, styleData: Partial<ChatStyle>): Promise<ChatStyle> {
    try {
      const newStyle = {
        ...styleData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collectionName), newStyle);
      
      return {
        id: docRef.id,
        ...newStyle
      } as ChatStyle;
    } catch (error) {
      console.error('創建樣式失敗:', error);
      throw error;
    }
  }

  // 獲取單個樣式
  async getStyleById(styleId: string): Promise<ChatStyle | null> {
    try {
      const docRef = doc(db, this.collectionName, styleId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as ChatStyle;
      }
      
      return null;
    } catch (error) {
      console.error('獲取樣式失敗:', error);
      return null;
    }
  }

  // 更新樣式
  async updateStyle(styleId: string, updates: Partial<ChatStyle>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, styleId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('更新樣式失敗:', error);
      throw error;
    }
  }

  // 刪除樣式
  async deleteStyle(styleId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, styleId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('刪除樣式失敗:', error);
      throw error;
    }
  }

  // 複製樣式
  async duplicateStyle(styleId: string, newName: string, userId: string): Promise<ChatStyle> {
    try {
      const originalStyle = await this.getStyleById(styleId);
      if (!originalStyle) {
        throw new Error('找不到要複製的樣式');
      }

      const { id, createdAt, updatedAt, ...styleData } = originalStyle;
      return await this.createStyle(userId, {
        ...styleData,
        name: newName
      });
    } catch (error) {
      console.error('複製樣式失敗:', error);
      throw error;
    }
  }
}

export const styleService = new StyleService();
export default styleService;
