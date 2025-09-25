# 07-Donation Progress System - 斗內進度系統

> 🤖 **AI 使用指南**：此模組實現視覺化斗內進度追蹤，提供目標設定和即時更新功能。AI 需特別注意動畫效果和即時同步機制。

## 🔄 前置需求檢查

### 📋 **必要條件**
- [ ] **依賴文檔**: 01-基礎系統架構、02-即時通訊系統、06-金流整合系統 (必須先完成)
- [ ] **可選依賴**: 03-YouTube 整合 (建議完成，提升實用性)
- [ ] **必要工具**: 已完成的金流系統、CSS 動畫基礎
- [ ] **技能需求**: 🟡 中等 - React 動畫、即時同步、數據視覺化
- [ ] **預估時間**: ⏱️ 1-2 週 (每日 2-4 小時)

### 🎯 **完成後可獲得**
- ✅ 視覺化進度條和目標追蹤
- ✅ 即時斗內金額更新
- ✅ 多種進度條樣式和動畫
- ✅ 目標達成慶祝效果
- ✅ 歷史進度數據分析

## 🎯 本階段目標

### 🏗️ **主要任務**
建立視覺化斗內進度追蹤系統，提供目標設定和即時更新功能。

### 📊 **完成標準**
- 進度條即時更新 (延遲 < 3 秒)
- 多種視覺化樣式可選
- 目標達成動畫效果流暢
- 歷史數據正確統計
- OBS 整合無縫運作

## 🔧 詳細執行步驟

### 🚨 第一步：進度數據模型
**位置**: backend/src/ 目錄
**目標**: 建立進度追蹤數據結構
**🎯 用戶情境**: 🟡 INTERMEDIATE

#### 💻 1.1 建立進度數據類型
```typescript
// 📋 CHECKLIST - 建立 src/types/progress.ts
export interface DonationGoal {
  id: string;
  streamerId: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
  };
}

export interface ProgressMilestone {
  id: string;
  goalId: string;
  amount: number;
  title: string;
  description?: string;
  isReached: boolean;
  reachedAt?: Date;
  reward?: string;
}

export interface ProgressStats {
  goalId: string;
  percentage: number;
  remainingAmount: number;
  averageDonationAmount: number;
  donationCount: number;
  estimatedTimeToComplete?: Date;
  dailyProgress: {
    date: string;
    amount: number;
    count: number;
  }[];
}
```

#### 💻 1.2 建立進度服務
```typescript
// 📋 CHECKLIST - 建立 src/services/progressService.ts
import { doc, setDoc, getDoc, collection, query, where, orderBy, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DonationGoal, ProgressMilestone, ProgressStats } from '../types/progress';
import { donationService } from './donationService';
import { v4 as uuidv4 } from 'uuid';

class ProgressService {
  // 建立斗內目標
  async createGoal(goalData: Omit<DonationGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<DonationGoal> {
    try {
      const goal: DonationGoal = {
        id: uuidv4(),
        ...goalData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = doc(db, 'donationGoals', goal.id);
      await setDoc(docRef, goal);

      return goal;
    } catch (error) {
      console.error('建立斗內目標失敗:', error);
      throw error;
    }
  }

  // 更新目標進度
  async updateGoalProgress(goalId: string, donationAmount: number): Promise<void> {
    try {
      const docRef = doc(db, 'donationGoals', goalId);
      const goalDoc = await getDoc(docRef);
      
      if (!goalDoc.exists()) {
        throw new Error('目標不存在');
      }

      const goal = goalDoc.data() as DonationGoal;
      const newAmount = goal.currentAmount + donationAmount;
      const isCompleted = newAmount >= goal.targetAmount;

      const updateData: any = {
        currentAmount: newAmount,
        updatedAt: new Date()
      };

      if (isCompleted && !goal.isCompleted) {
        updateData.isCompleted = true;
        updateData.completedAt = new Date();
      }

      await updateDoc(docRef, updateData);

      // 檢查里程碑
      await this.checkMilestones(goalId, newAmount);
    } catch (error) {
      console.error('更新目標進度失敗:', error);
      throw error;
    }
  }

  // 獲取進度統計
  async getProgressStats(goalId: string): Promise<ProgressStats> {
    try {
      const goalDoc = await getDoc(doc(db, 'donationGoals', goalId));
      if (!goalDoc.exists()) {
        throw new Error('目標不存在');
      }

      const goal = goalDoc.data() as DonationGoal;
      const donations = await donationService.getDonationsByStreamer(goal.streamerId);
      
      // 計算相關統計
      const goalDonations = donations.filter(d => 
        d.status === 'completed' && 
        d.paymentDate && 
        d.paymentDate >= goal.startDate
      );

      const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
      const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);
      const averageDonationAmount = goalDonations.length > 0 
        ? goalDonations.reduce((sum, d) => sum + d.amount, 0) / goalDonations.length 
        : 0;

      // 計算每日進度
      const dailyProgress = this.calculateDailyProgress(goalDonations, goal.startDate);

      return {
        goalId,
        percentage,
        remainingAmount,
        averageDonationAmount,
        donationCount: goalDonations.length,
        dailyProgress
      };
    } catch (error) {
      console.error('獲取進度統計失敗:', error);
      throw error;
    }
  }

  // 計算每日進度
  private calculateDailyProgress(donations: any[], startDate: Date): any[] {
    const dailyMap = new Map();
    
    donations.forEach(donation => {
      if (donation.paymentDate) {
        const dateKey = donation.paymentDate.toISOString().split('T')[0];
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { amount: 0, count: 0 });
        }
        const daily = dailyMap.get(dateKey);
        daily.amount += donation.amount;
        daily.count += 1;
      }
    });

    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      amount: data.amount,
      count: data.count
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  // 檢查里程碑
  private async checkMilestones(goalId: string, currentAmount: number): Promise<void> {
    try {
      const q = query(
        collection(db, 'progressMilestones'),
        where('goalId', '==', goalId),
        where('isReached', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const milestones = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProgressMilestone[];

      for (const milestone of milestones) {
        if (currentAmount >= milestone.amount) {
          await updateDoc(doc(db, 'progressMilestones', milestone.id), {
            isReached: true,
            reachedAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('檢查里程碑失敗:', error);
    }
  }
}

export const progressService = new ProgressService();
```

### 🚨 第二步：進度條組件
**位置**: frontend/src/ 目錄
**目標**: 建立視覺化進度條組件
**🎯 用戶情境**: 🟡 INTERMEDIATE

#### 💻 2.1 基礎進度條組件
```typescript
// 📋 CHECKLIST - 建立 src/components/ProgressBar.tsx
import React, { useEffect, useState } from 'react';
import { DonationGoal, ProgressStats } from '../types/progress';

interface ProgressBarProps {
  goal: DonationGoal;
  stats: ProgressStats;
  style?: 'default' | 'gradient' | 'neon' | 'minimal';
  showAnimation?: boolean;
  showMilestones?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  goal,
  stats,
  style = 'default',
  showAnimation = true,
  showMilestones = true
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setAnimatedPercentage(stats.percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedPercentage(stats.percentage);
    }
  }, [stats.percentage, showAnimation]);

  const getProgressBarStyle = () => {
    const baseClasses = "h-8 rounded-full transition-all duration-1000 ease-out";
    
    switch (style) {
      case 'gradient':
        return `${baseClasses} bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500`;
      case 'neon':
        return `${baseClasses} bg-cyan-400 shadow-lg shadow-cyan-400/50`;
      case 'minimal':
        return `${baseClasses} bg-gray-800`;
      default:
        return `${baseClasses} bg-green-500`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white/10 backdrop-blur-sm rounded-xl">
      {/* 目標標題 */}
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-white mb-2">{goal.title}</h3>
        {goal.description && (
          <p className="text-gray-300 text-sm">{goal.description}</p>
        )}
      </div>

      {/* 進度數據 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-white">
          <span className="text-3xl font-bold">
            {formatCurrency(goal.currentAmount)}
          </span>
          <span className="text-gray-300 ml-2">
            / {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {stats.percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-300">
            還需 {formatCurrency(stats.remainingAmount)}
          </div>
        </div>
      </div>

      {/* 進度條 */}
      <div className="relative mb-4">
        <div className="w-full h-8 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={getProgressBarStyle()}
            style={{
              width: `${Math.min(animatedPercentage, 100)}%`,
              transition: showAnimation ? 'width 1s ease-out' : 'none'
            }}
          />
        </div>
        
        {/* 進度百分比標籤 */}
        <div 
          className="absolute top-0 h-8 flex items-center justify-center text-white font-bold text-sm"
          style={{ 
            left: `${Math.min(animatedPercentage, 100)}%`,
            transform: 'translateX(-50%)'
          }}
        >
          {stats.percentage >= 5 && `${stats.percentage.toFixed(0)}%`}
        </div>
      </div>

      {/* 統計信息 */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-white font-bold text-lg">{stats.donationCount}</div>
          <div className="text-gray-300">總斗內次數</div>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-white font-bold text-lg">
            {formatCurrency(stats.averageDonationAmount)}
          </div>
          <div className="text-gray-300">平均金額</div>
        </div>
      </div>

      {/* 完成慶祝效果 */}
      {goal.isCompleted && (
        <div className="mt-4 text-center">
          <div className="text-4xl animate-bounce">🎉</div>
          <div className="text-xl font-bold text-yellow-400 mt-2">
            目標達成！
          </div>
        </div>
      )}
    </div>
  );
};
```

#### 💻 2.2 進度管理組件
```typescript
// 📋 CHECKLIST - 建立 src/components/ProgressManager.tsx
import React, { useState, useEffect } from 'react';
import { DonationGoal, ProgressStats } from '../types/progress';
import { ProgressBar } from './ProgressBar';
import { useAuth } from '../hooks/useAuth';

export const ProgressManager: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<DonationGoal[]>([]);
  const [activeGoal, setActiveGoal] = useState<DonationGoal | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // 新目標表單狀態
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetAmount: 1000
  });

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  useEffect(() => {
    if (activeGoal) {
      loadStats(activeGoal.id);
    }
  }, [activeGoal]);

  const loadGoals = async () => {
    try {
      // 這裡應該調用 API 獲取目標列表
      // const response = await fetch(`/api/goals/${user.uid}`);
      // const goalsData = await response.json();
      // setGoals(goalsData);
      
      // 暫時使用模擬數據
      const mockGoals: DonationGoal[] = [
        {
          id: '1',
          streamerId: user!.uid,
          title: '新設備基金',
          description: '購買新的直播設備',
          targetAmount: 50000,
          currentAmount: 15000,
          startDate: new Date(),
          isActive: true,
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      setGoals(mockGoals);
      if (mockGoals.length > 0) {
        setActiveGoal(mockGoals[0]);
      }
    } catch (error) {
      console.error('載入目標失敗:', error);
    }
  };

  const loadStats = async (goalId: string) => {
    try {
      // 這裡應該調用 API 獲取統計數據
      // const response = await fetch(`/api/goals/${goalId}/stats`);
      // const statsData = await response.json();
      // setStats(statsData);
      
      // 暫時使用模擬數據
      const mockStats: ProgressStats = {
        goalId,
        percentage: 30,
        remainingAmount: 35000,
        averageDonationAmount: 150,
        donationCount: 100,
        dailyProgress: []
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('載入統計失敗:', error);
    }
  };

  const createGoal = async () => {
    try {
      if (!newGoal.title || newGoal.targetAmount <= 0) {
        alert('請填寫完整的目標信息');
        return;
      }

      // 這裡應該調用 API 創建新目標
      // const response = await fetch('/api/goals', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...newGoal,
      //     streamerId: user.uid
      //   })
      // });
      
      // 暫時添加到本地狀態
      const goal: DonationGoal = {
        id: Date.now().toString(),
        streamerId: user!.uid,
        ...newGoal,
        currentAmount: 0,
        startDate: new Date(),
        isActive: true,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setGoals([...goals, goal]);
      setActiveGoal(goal);
      setIsCreating(false);
      setNewGoal({ title: '', description: '', targetAmount: 1000 });
    } catch (error) {
      console.error('創建目標失敗:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          斗內進度追蹤
        </h1>

        {/* 目標選擇器 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 justify-center mb-4">
            {goals.map(goal => (
              <button
                key={goal.id}
                onClick={() => setActiveGoal(goal)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeGoal?.id === goal.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {goal.title}
              </button>
            ))}
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              + 新增目標
            </button>
          </div>
        </div>

        {/* 新增目標表單 */}
        {isCreating && (
          <div className="mb-8 p-6 bg-white/10 backdrop-blur-sm rounded-xl">
            <h3 className="text-xl font-bold text-white mb-4">建立新目標</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="目標標題"
                value={newGoal.title}
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                className="px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20"
              />
              <input
                type="text"
                placeholder="目標描述 (可選)"
                value={newGoal.description}
                onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                className="px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20"
              />
              <input
                type="number"
                placeholder="目標金額"
                value={newGoal.targetAmount}
                onChange={(e) => setNewGoal({...newGoal, targetAmount: parseInt(e.target.value) || 0})}
                className="px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20"
              />
            </div>
            <div className="flex gap-4 mt-4">
              <button
                onClick={createGoal}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                建立目標
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 進度條顯示 */}
        {activeGoal && stats && (
          <ProgressBar
            goal={activeGoal}
            stats={stats}
            style="gradient"
            showAnimation={true}
            showMilestones={true}
          />
        )}
      </div>
    </div>
  );
};
```

## ✅ 完成驗證

### 🧪 **功能測試**
```markdown
測試清單：
- [ ] 進度條即時更新正常
- [ ] 動畫效果流暢
- [ ] 目標達成慶祝效果
- [ ] 統計數據計算正確
- [ ] 多種樣式切換正常
- [ ] OBS 整合顯示正常
```

### 🔒 **效能檢查**
- [ ] 動畫效能最佳化
- [ ] 即時更新延遲 < 3 秒
- [ ] 記憶體使用穩定
- [ ] 大量數據處理正常
- [ ] 響應式設計適配

---

**🎉 恭喜！** 斗內進度系統完成，現在支援完整的視覺化進度追蹤！
