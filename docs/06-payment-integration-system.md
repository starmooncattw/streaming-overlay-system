# 06-Payment Integration System - 金流整合系統

> 🤖 **AI 使用指南**：此模組實現綠界金流整合，提供斗內功能。AI 需特別注意安全性設定和 Webhook 驗證機制。

## 🔄 前置需求檢查

### 📋 **必要條件**
- [ ] **依賴文檔**: 01-基礎系統架構、02-即時通訊系統 (必須先完成)
- [ ] **可選依賴**: 03-YouTube 整合 (建議完成，提升實用性)
- [ ] **必要工具**: 綠界科技商店帳號、SSL 憑證 (正式環境)
- [ ] **技能需求**: 🟡 中等 - 金流 API、Webhook 處理、安全驗證
- [ ] **預估時間**: ⏱️ 1-2 週 (每日 2-4 小時)

### 🎯 **完成後可獲得**
- ✅ 完整的綠界金流設定系統
- ✅ 安全的付款頁面生成
- ✅ Webhook 通知處理機制
- ✅ 即時斗內通知顯示
- ✅ 完整的交易記錄和管理

## 🎯 本階段目標

### 🏗️ **主要任務**
整合綠界科技金流服務，實現安全可靠的斗內功能。

### 📊 **完成標準**
- 綠界金流設定和驗證完整
- 付款頁面生成正常運作
- Webhook 通知即時處理 (延遲 < 30 秒)
- 交易安全驗證機制完善
- 斗內訊息即時顯示在 OBS

## 🔧 詳細執行步驟

### 🚨 第一步：綠界科技設定
**位置**: 綠界科技商店後台
**目標**: 建立商店和取得 API 金鑰
**🎯 用戶情境**: 🟢 BEGINNER | 🟡 INTERMEDIATE

#### 💻 1.1 註冊綠界科技商店
```bash
# 📋 CHECKLIST - 綠界科技註冊
# 1. 前往 https://www.ecpay.com.tw/
# 2. 點擊「免費申請」
# 3. 選擇「個人賣家」或「企業賣家」
# 4. 填寫基本資料和聯絡資訊
# 5. 上傳身分證明文件
# 6. 等待審核通過 (通常 1-3 個工作天)
```

#### 💻 1.2 取得 API 金鑰和設定
```bash
# 📋 CHECKLIST - API 金鑰設定
# 1. 登入綠界科技商店後台
# 2. 前往「系統開發」→「系統整合設定」
# 3. 記錄以下資訊：
#    - 商店代號 (MerchantID)
#    - 金鑰 (HashKey)
#    - 向量 (HashIV)
# 4. 設定付款完成通知網址 (ReturnURL)
# 5. 設定付款完成 Server 端通知網址 (OrderResultURL)
```

#### 💻 1.3 測試環境設定
```bash
# 📋 CHECKLIST - 測試環境配置
# 測試環境資訊：
# - 測試網址: https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5
# - 測試商店代號: 2000132
# - 測試 HashKey: 5294y06JbISpM5x9
# - 測試 HashIV: v77hoKGq4kWxNNIS
```

### 🚨 第二步：綠界金流服務
**位置**: backend/src/ 目錄
**目標**: 建立綠界 API 整合服務
**🎯 用戶情境**: 🟡 INTERMEDIATE | 🔴 ADVANCED

#### 💻 2.1 安裝加密套件
```bash
# 📋 CHECKLIST - 安裝必要套件
cd backend
npm install crypto-js moment
npm install @types/crypto-js --save-dev
```

#### 💻 2.2 建立綠界金流服務
```typescript
// 📋 CHECKLIST - 建立 src/services/ecpayService.ts
import CryptoJS from 'crypto-js';
import moment from 'moment';

interface ECPayConfig {
  merchantID: string;
  hashKey: string;
  hashIV: string;
  returnURL: string;
  orderResultURL: string;
  isProduction: boolean;
}

interface DonationOrder {
  merchantTradeNo: string;
  merchantTradeDate: string;
  totalAmount: number;
  tradeDesc: string;
  itemName: string;
  returnURL: string;
  orderResultURL: string;
  clientBackURL?: string;
  customField1?: string; // streamerId
  customField2?: string; // donorName
  customField3?: string; // message
  customField4?: string; // styleId
}

class ECPayService {
  private config: ECPayConfig;
  private readonly API_URL_PRODUCTION = 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5';
  private readonly API_URL_STAGE = 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';

  constructor() {
    this.config = {
      merchantID: process.env.ECPAY_MERCHANT_ID || '2000132',
      hashKey: process.env.ECPAY_HASH_KEY || '5294y06JbISpM5x9',
      hashIV: process.env.ECPAY_HASH_IV || 'v77hoKGq4kWxNNIS',
      returnURL: process.env.ECPAY_RETURN_URL || 'http://localhost:3001/ecpay/return',
      orderResultURL: process.env.ECPAY_ORDER_RESULT_URL || 'http://localhost:3001/ecpay/notify',
      isProduction: process.env.NODE_ENV === 'production'
    };
  }

  // 建立斗內訂單
  createDonationOrder(params: {
    streamerId: string;
    amount: number;
    donorName: string;
    message: string;
    styleId?: string;
  }): { formHTML: string; tradeNo: string } {
    
    const tradeNo = this.generateTradeNo();
    const tradeDate = moment().format('YYYY/MM/DD HH:mm:ss');

    const orderData: DonationOrder = {
      merchantTradeNo: tradeNo,
      merchantTradeDate: tradeDate,
      totalAmount: params.amount,
      tradeDesc: `斗內給 ${params.streamerId}`,
      itemName: `斗內 NT$${params.amount}`,
      returnURL: this.config.returnURL,
      orderResultURL: this.config.orderResultURL,
      clientBackURL: `${process.env.FRONTEND_URL}/donation/success`,
      customField1: params.streamerId,
      customField2: params.donorName,
      customField3: params.message,
      customField4: params.styleId || 'default'
    };

    const formData = this.buildFormData(orderData);
    const checkMacValue = this.generateCheckMacValue(formData);
    
    formData.CheckMacValue = checkMacValue;

    const formHTML = this.generatePaymentForm(formData);

    return {
      formHTML,
      tradeNo
    };
  }

  // 建立表單資料
  private buildFormData(order: DonationOrder): any {
    return {
      MerchantID: this.config.merchantID,
      MerchantTradeNo: order.merchantTradeNo,
      MerchantTradeDate: order.merchantTradeDate,
      PaymentType: 'aio',
      TotalAmount: order.totalAmount,
      TradeDesc: order.tradeDesc,
      ItemName: order.itemName,
      ReturnURL: order.returnURL,
      OrderResultURL: order.orderResultURL,
      ClientBackURL: order.clientBackURL,
      ChoosePayment: 'ALL',
      EncryptType: 1,
      CustomField1: order.customField1,
      CustomField2: order.customField2,
      CustomField3: order.customField3,
      CustomField4: order.customField4
    };
  }

  // 生成檢查碼
  private generateCheckMacValue(params: any): string {
    // 移除空值和 CheckMacValue
    const filteredParams = Object.keys(params)
      .filter(key => params[key] !== '' && key !== 'CheckMacValue')
      .reduce((obj: any, key) => {
        obj[key] = params[key];
        return obj;
      }, {});

    // 按照 key 排序
    const sortedKeys = Object.keys(filteredParams).sort();
    
    // 建立查詢字串
    let queryString = sortedKeys
      .map(key => `${key}=${filteredParams[key]}`)
      .join('&');

    // 加上 HashKey 和 HashIV
    queryString = `HashKey=${this.config.hashKey}&${queryString}&HashIV=${this.config.hashIV}`;

    // URL 編碼
    queryString = encodeURIComponent(queryString).toLowerCase();

    // MD5 雜湊
    const hash = CryptoJS.MD5(queryString).toString().toUpperCase();

    return hash;
  }

  // 生成付款表單 HTML
  private generatePaymentForm(formData: any): string {
    const apiUrl = this.config.isProduction ? this.API_URL_PRODUCTION : this.API_URL_STAGE;
    
    let formHTML = `<form id="ecpay-form" method="post" action="${apiUrl}">`;
    
    Object.keys(formData).forEach(key => {
      formHTML += `<input type="hidden" name="${key}" value="${formData[key]}">`;
    });
    
    formHTML += `
      <input type="submit" value="前往付款" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
    </form>
    <script>
      // 自動提交表單 (可選)
      // document.getElementById('ecpay-form').submit();
    </script>`;

    return formHTML;
  }

  // 驗證回傳資料
  verifyCallback(params: any): boolean {
    try {
      const receivedCheckMacValue = params.CheckMacValue;
      delete params.CheckMacValue;

      const calculatedCheckMacValue = this.generateCheckMacValue(params);
      
      return receivedCheckMacValue === calculatedCheckMacValue;
    } catch (error) {
      console.error('驗證綠界回傳資料失敗:', error);
      return false;
    }
  }

  // 解析付款結果
  parsePaymentResult(params: any): {
    isSuccess: boolean;
    tradeNo: string;
    amount: number;
    streamerId: string;
    donorName: string;
    message: string;
    styleId: string;
    paymentDate: Date;
  } {
    return {
      isSuccess: params.RtnCode === '1',
      tradeNo: params.MerchantTradeNo,
      amount: parseInt(params.TradeAmt),
      streamerId: params.CustomField1,
      donorName: params.CustomField2,
      message: params.CustomField3,
      styleId: params.CustomField4,
      paymentDate: new Date(params.PaymentDate)
    };
  }

  // 生成交易編號
  private generateTradeNo(): string {
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DONATE${timestamp}${random}`;
  }
}

export const ecpayService = new ECPayService();
```

### 🚨 第三步：斗內管理系統
**位置**: backend/src/ 目錄
**目標**: 建立斗內記錄和通知系統
**🎯 用戶情境**: 🟡 INTERMEDIATE

#### 💻 3.1 建立斗內資料模型
```typescript
// 📋 CHECKLIST - 建立 src/types/donation.ts
export interface Donation {
  id: string;
  streamerId: string;
  tradeNo: string;
  amount: number;
  donorName: string;
  message: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    styleId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface DonationNotification {
  id: string;
  donationId: string;
  streamerId: string;
  amount: number;
  donorName: string;
  message: string;
  isDisplayed: boolean;
  displayedAt?: Date;
  createdAt: Date;
}
```

#### 💻 3.2 建立斗內服務
```typescript
// 📋 CHECKLIST - 建立 src/services/donationService.ts
import { doc, setDoc, getDoc, collection, query, where, orderBy, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Donation, DonationNotification } from '../types/donation';
import { v4 as uuidv4 } from 'uuid';

class DonationService {
  // 建立斗內記錄
  async createDonation(donationData: Omit<Donation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Donation> {
    try {
      const donation: Donation = {
        id: uuidv4(),
        ...donationData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = doc(db, 'donations', donation.id);
      await setDoc(docRef, donation);

      return donation;
    } catch (error) {
      console.error('建立斗內記錄失敗:', error);
      throw error;
    }
  }

  // 更新斗內狀態
  async updateDonationStatus(donationId: string, status: Donation['status'], paymentData?: any): Promise<void> {
    try {
      const docRef = doc(db, 'donations', donationId);
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (paymentData) {
        updateData.paymentMethod = paymentData.paymentMethod;
        updateData.paymentDate = paymentData.paymentDate;
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('更新斗內狀態失敗:', error);
      throw error;
    }
  }

  // 建立斗內通知
  async createDonationNotification(donation: Donation): Promise<DonationNotification> {
    try {
      const notification: DonationNotification = {
        id: uuidv4(),
        donationId: donation.id,
        streamerId: donation.streamerId,
        amount: donation.amount,
        donorName: donation.donorName,
        message: donation.message,
        isDisplayed: false,
        createdAt: new Date()
      };

      const docRef = doc(db, 'donationNotifications', notification.id);
      await setDoc(docRef, notification);

      return notification;
    } catch (error) {
      console.error('建立斗內通知失敗:', error);
      throw error;
    }
  }

  // 獲取斗內記錄
  async getDonationsByStreamer(streamerId: string, limit: number = 50): Promise<Donation[]> {
    try {
      const q = query(
        collection(db, 'donations'),
        where('streamerId', '==', streamerId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Donation);
    } catch (error) {
      console.error('獲取斗內記錄失敗:', error);
      throw error;
    }
  }

  // 獲取斗內統計
  async getDonationStats(streamerId: string): Promise<{
    totalAmount: number;
    totalCount: number;
    todayAmount: number;
    todayCount: number;
  }> {
    try {
      const donations = await this.getDonationsByStreamer(streamerId, 1000);
      const completedDonations = donations.filter(d => d.status === 'completed');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayDonations = completedDonations.filter(d => d.paymentDate && d.paymentDate >= today);

      return {
        totalAmount: completedDonations.reduce((sum, d) => sum + d.amount, 0),
        totalCount: completedDonations.length,
        todayAmount: todayDonations.reduce((sum, d) => sum + d.amount, 0),
        todayCount: todayDonations.length
      };
    } catch (error) {
      console.error('獲取斗內統計失敗:', error);
      throw error;
    }
  }

  // 標記通知為已顯示
  async markNotificationAsDisplayed(notificationId: string): Promise<void> {
    try {
      const docRef = doc(db, 'donationNotifications', notificationId);
      await updateDoc(docRef, {
        isDisplayed: true,
        displayedAt: new Date()
      });
    } catch (error) {
      console.error('標記通知失敗:', error);
      throw error;
    }
  }
}

export const donationService = new DonationService();
```

### 🚨 第四步：Webhook 處理器
**位置**: backend/src/ 目錄
**目標**: 處理綠界付款通知
**🎯 用戶情境**: 🔴 ADVANCED

#### 💻 4.1 建立 Webhook 路由
```typescript
// 📋 CHECKLIST - 建立 src/routes/ecpayRoutes.ts
import express from 'express';
import { ecpayService } from '../services/ecpayService';
import { donationService } from '../services/donationService';
import { messageService } from '../services/messageService';
import { ChatMessage } from '../types/message';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 付款完成通知 (Server 端)
router.post('/notify', async (req, res) => {
  try {
    console.log('收到綠界付款通知:', req.body);

    // 驗證資料完整性
    const isValid = ecpayService.verifyCallback(req.body);
    if (!isValid) {
      console.error('綠界回傳資料驗證失敗');
      return res.status(400).send('0|驗證失敗');
    }

    // 解析付款結果
    const paymentResult = ecpayService.parsePaymentResult(req.body);
    
    if (paymentResult.isSuccess) {
      // 查找對應的斗內記錄
      const donation = await findDonationByTradeNo(paymentResult.tradeNo);
      
      if (donation) {
        // 更新斗內狀態
        await donationService.updateDonationStatus(donation.id, 'completed', {
          paymentMethod: req.body.PaymentType,
          paymentDate: paymentResult.paymentDate
        });

        // 建立斗內通知
        const notification = await donationService.createDonationNotification(donation);

        // 建立聊天訊息
        const chatMessage: ChatMessage = {
          id: uuidv4(),
          streamerId: paymentResult.streamerId,
          username: paymentResult.donorName,
          message: `斗內 NT$${paymentResult.amount}：${paymentResult.message}`,
          timestamp: new Date(),
          platform: 'donation',
          metadata: {
            donationId: donation.id,
            amount: paymentResult.amount,
            isDonation: true
          }
        };

        // 添加到訊息系統
        messageService.addMessage(paymentResult.streamerId, chatMessage);

        // 透過 WebSocket 即時廣播
        // socketHandler.broadcastMessage(paymentResult.streamerId, chatMessage);

        console.log(`斗內完成: ${paymentResult.donorName} 斗內 NT$${paymentResult.amount}`);
      }
    } else {
      console.error('付款失敗:', req.body);
    }

    // 回應綠界 (必須回應 "1|OK")
    res.send('1|OK');
  } catch (error) {
    console.error('處理綠界通知失敗:', error);
    res.status(500).send('0|處理失敗');
  }
});

// 付款完成返回頁面
router.post('/return', (req, res) => {
  try {
    const paymentResult = ecpayService.parsePaymentResult(req.body);
    
    if (paymentResult.isSuccess) {
      res.redirect(`${process.env.FRONTEND_URL}/donation/success?tradeNo=${paymentResult.tradeNo}`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/donation/failed?tradeNo=${paymentResult.tradeNo}`);
    }
  } catch (error) {
    console.error('處理付款返回失敗:', error);
    res.redirect(`${process.env.FRONTEND_URL}/donation/error`);
  }
});

// 輔助函數：根據交易編號查找斗內記錄
async function findDonationByTradeNo(tradeNo: string): Promise<any> {
  // 這裡需要實作查詢邏輯
  // 可以從資料庫或快取中查找
  return null; // 簡化實作
}

export default router;
```

## ✅ 完成驗證

### 🧪 **功能測試**
```markdown
測試清單：
- [ ] 綠界金流設定正確
- [ ] 付款頁面生成正常
- [ ] 測試付款流程完整
- [ ] Webhook 通知處理正常
- [ ] 斗內訊息即時顯示
- [ ] 交易記錄正確儲存
```

### 🔒 **安全檢查**
- [ ] CheckMacValue 驗證機制正常
- [ ] 敏感資料加密儲存
- [ ] Webhook IP 白名單設定 (正式環境)
- [ ] 交易金額驗證機制
- [ ] 重複通知防護機制

---

**🎉 恭喜！** 金流整合系統完成，現在支援完整的斗內功能！
