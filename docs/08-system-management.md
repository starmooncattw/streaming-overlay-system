# 08-System Management - 系統管理與用戶權限控制

> 🤖 **AI 使用指南**：此模組實現完整的系統管理功能，包含用戶權限控制、狀態管理、系統監控和資源管理。AI 需特別注意安全性、權限控制和擴展性設計。

## 🔄 前置需求檢查

### 📋 **必要條件**
- [ ] **依賴文檔**: 01-基礎系統架構、02-即時通訊系統 (必須先完成)
- [ ] **可選依賴**: 所有其他模組 (建議完成，提升管理效果)
- [ ] **必要工具**: 監控工具、日誌系統、管理權限
- [ ] **技能需求**: 🔴 進階 - 系統監控、用戶管理、安全設計
- [ ] **預估時間**: ⏱️ 1-2 週 (每日 2-4 小時)

### 🎯 **完成後可獲得**
- ✅ 完整的用戶權限控制系統
- ✅ 用戶狀態管理機制 (ACTIVE/SUSPENDED/BLOCKED等)
- ✅ 完整的系統監控面板
- ✅ 多用戶權限管理和資源監控
- ✅ 自動化維護任務和系統容量控制
- ✅ 錯誤日誌追蹤和系統健康檢查

## 🎯 本階段目標

### 🏗️ **主要任務**
建立完整的系統管理和用戶權限控制功能，實現安全的多用戶環境和自動化資源管理。

### 📊 **完成標準**
- 用戶權限分級和狀態控制機制完善
- API和頁面層級權限檢查有效
- 自動化維護任務正常運作
- 監控數據即時更新，系統健康狀態準確
- 管理介面易於使用，權限控制嚴格

## 🔧 詳細執行步驟

### 🚨 第零步：用戶權限與狀態控制系統
**位置**: backend/src/ 目錄
**目標**: 建立完整的用戶權限分級和狀態控制機制
**🎯 用戶情境**: 🔴 ADVANCED

#### 💻 0.1 用戶權限分類定義
```typescript
// 📋 CHECKLIST - 建立 src/types/userPermissions.ts

// 用戶類型枚舉
export enum UserRole {
  AUTHENTICATED_USER = 'authenticated_user',  // 已認證使用者
  ANONYMOUS_VISITOR = 'anonymous_visitor',    // 匿名訪客
  SYSTEM_ADMIN = 'system_admin'              // 系統管理員 (預留)
}

// 用戶狀態枚舉
export enum UserStatus {
  ACTIVE = 'active',           // 正常使用
  SUSPENDED = 'suspended',     // 暫停使用
  SYSTEM_FULL = 'system_full', // 系統達使用者上限
  INACTIVE = 'inactive',       // 長期未使用
  BLOCKED = 'blocked'          // 被封鎖
}

// 用戶狀態配置
export const UserStatusConfig = {
  [UserStatus.ACTIVE]: {
    canLogin: true,
    canUseFeatures: true,
    message: null
  },
  [UserStatus.SUSPENDED]: {
    canLogin: false,
    canUseFeatures: false,  
    message: '帳號已暫停使用，請聯繫管理員'
  },
  [UserStatus.SYSTEM_FULL]: {
    canLogin: false,
    canUseFeatures: false,
    message: '系統已達使用者上限，請稍後再試'
  },
  [UserStatus.INACTIVE]: {
    canLogin: true,           // 可以登入重新激活
    canUseFeatures: true,
    message: '歡迎回來！帳號已重新激活'
  },
  [UserStatus.BLOCKED]: {
    canLogin: false,
    canUseFeatures: false,
    message: '帳號已被停用'
  }
};

// 用戶資料結構
export interface User {
  userId: string;              // 隨機生成的主鍵
  email: string;               // Google 登入 email
  role: UserRole;              // 用戶角色
  status: UserStatus;          // 用戶狀態
  statusReason?: string;       // 狀態變更原因
  suspendedAt?: Date;         // 暫停時間
  suspendedUntil?: Date;      // 暫停到期時間
  lastLoginAt: Date;          // 最後登入時間
  createdAt: Date;            // 建立時間
  updatedAt: Date;            // 更新時間
}
```

#### 💻 0.2 權限檢查中介軟體
```typescript
// 📋 CHECKLIST - 建立 src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { User, UserStatus, UserStatusConfig } from '../types/userPermissions';

// 基礎認證檢查
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // 1. 檢查JWT token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: '需要登入才能存取此功能'
    });
  }

  // 2. 驗證使用者身份
  try {
    const user = verifyJWTToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: '無效的認證令牌'
    });
  }
}

// 使用者狀態檢查
export function requireActiveUser(req: Request, res: Response, next: NextFunction) {
  const user = req.user as User;
  
  if (user.status !== UserStatus.ACTIVE) {
    const config = UserStatusConfig[user.status];
    
    return res.status(403).json({
      error: 'ACCESS_DENIED',
      message: config.message
    });
  }
  
  next();
}

// 資源擁有權檢查
export function requireOwnership(resource: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = req.params.id;
    const user = req.user as User;
    
    try {
      const resourceData = await getResource(resource, resourceId);
      
      if (resourceData.userId !== user.userId) {
        return res.status(403).json({
          error: 'OWNERSHIP_REQUIRED',
          message: '您只能操作自己的資源'
        });
      }
      
      next();
    } catch (error) {
      return res.status(404).json({
        error: 'RESOURCE_NOT_FOUND',
        message: '找不到指定的資源'
      });
    }
  };
}

// 管理員權限檢查
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user as User;
  
  if (user.role !== 'system_admin') {
    return res.status(403).json({
      error: 'ADMIN_REQUIRED',
      message: '需要管理員權限'
    });
  }
  
  next();
}
```

#### 💻 0.3 自動化用戶管理服務
```typescript
// 📋 CHECKLIST - 建立 src/services/userManagementService.ts
import { User, UserStatus } from '../types/userPermissions';

class UserManagementService {
  // 檢查系統是否已滿
  async isSystemFull(): Promise<boolean> {
    const activeCount = await this.countUsers({ status: UserStatus.ACTIVE });
    const systemLimit = await this.getSystemConfig('USER_LIMIT', 10);
    
    return activeCount >= systemLimit;
  }

  // 用戶登入時的狀態檢查
  async authenticateUser(googleToken: string) {
    const user = await this.getUserFromToken(googleToken);
    
    // 檢查系統使用者數量限制 (新使用者)
    if (!user && await this.isSystemFull()) {
      return {
        success: false,
        reason: 'SYSTEM_FULL',
        message: '系統已達使用者上限，請稍後再試'
      };
    }
    
    // 檢查現有使用者狀態
    if (user && user.status !== UserStatus.ACTIVE && user.status !== UserStatus.INACTIVE) {
      const config = UserStatusConfig[user.status];
      
      return {
        success: false,
        reason: user.status,
        message: config.message
      };
    }
    
    // INACTIVE使用者重新激活
    if (user && user.status === UserStatus.INACTIVE) {
      await this.updateUserStatus(user.userId, UserStatus.ACTIVE);
      user.status = UserStatus.ACTIVE;
    }
    
    // 建立新使用者 (如果不存在)
    if (!user) {
      user = await this.createNewUser(googleToken);
    }
    
    // 更新最後登入時間
    await this.updateLastLogin(user.userId);
    
    return { success: true, user };
  }

  // 定期維護任務
  async runMaintenanceTasks() {
    await this.markInactiveUsers();
    await this.enforceSystemLimit();
    await this.cleanupInactiveUsers();
  }

  // 標記非活躍使用者
  private async markInactiveUsers() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const result = await this.updateUsersWhere(
      { 
        lastLoginAt: { lt: sixMonthsAgo }, 
        status: UserStatus.ACTIVE 
      },
      { 
        status: UserStatus.INACTIVE,
        statusReason: '6個月未登入自動標記為非活躍'
      }
    );
    
    console.log(`標記 ${result.count} 個使用者為非活躍狀態`);
  }

  // 系統容量控制
  private async enforceSystemLimit() {
    const activeCount = await this.countUsers({ status: UserStatus.ACTIVE });
    const systemLimit = await this.getSystemConfig('USER_LIMIT', 10);
    
    if (activeCount > systemLimit) {
      const excessUsers = await this.getExcessUsers(activeCount - systemLimit);
      
      for (const user of excessUsers) {
        await this.updateUserStatus(
          user.userId, 
          UserStatus.SUSPENDED,
          '系統達使用者上限自動暫停'
        );
      }
      
      console.log(`因系統容量限制暫停 ${excessUsers.length} 個使用者`);
    }
  }

  // 清理長期非活躍使用者
  private async cleanupInactiveUsers() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const result = await this.deleteUsersWhere({
      status: UserStatus.INACTIVE,
      updatedAt: { lt: oneYearAgo }
    });
    
    console.log(`清理 ${result.count} 個長期非活躍使用者`);
  }

  // 手動用戶管理方法
  async suspendUser(userId: string, reason: string, duration?: number): Promise<void> {
    const suspendedUntil = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : undefined;
    
    await this.updateUserStatus(userId, UserStatus.SUSPENDED, reason);
    if (suspendedUntil) {
      await this.updateUser(userId, { suspendedUntil });
    }
  }

  async reactivateUser(userId: string, reason: string): Promise<void> {
    await this.updateUserStatus(userId, UserStatus.ACTIVE, reason);
    await this.updateUser(userId, { suspendedUntil: null });
  }

  async blockUser(userId: string, reason: string): Promise<void> {
    await this.updateUserStatus(userId, UserStatus.BLOCKED, reason);
  }

  // 輔助方法 (需要實作)
  private async getUserFromToken(token: string): Promise<User | null> { /* 實作 */ }
  private async createNewUser(token: string): Promise<User> { /* 實作 */ }
  private async updateUserStatus(userId: string, status: UserStatus, reason?: string): Promise<void> { /* 實作 */ }
  private async updateLastLogin(userId: string): Promise<void> { /* 實作 */ }
  private async countUsers(filter: any): Promise<number> { /* 實作 */ }
  private async getSystemConfig(key: string, defaultValue: any): Promise<any> { /* 實作 */ }
  private async updateUsersWhere(filter: any, update: any): Promise<{count: number}> { /* 實作 */ }
  private async deleteUsersWhere(filter: any): Promise<{count: number}> { /* 實作 */ }
  private async getExcessUsers(count: number): Promise<User[]> { /* 實作 */ }
  private async updateUser(userId: string, data: any): Promise<void> { /* 實作 */ }
}

export const userManagementService = new UserManagementService();
```

### 🚨 第一步：系統監控服務
**位置**: backend/src/ 目錄
**目標**: 建立系統監控和健康檢查
**🎯 用戶情境**: 🔴 ADVANCED

#### 💻 1.1 建立監控數據類型
```typescript
// 📋 CHECKLIST - 建立 src/types/monitoring.ts
export interface SystemHealth {
  timestamp: Date;
  status: 'healthy' | 'warning' | 'critical';
  services: {
    database: ServiceStatus;
    websocket: ServiceStatus;
    api: ServiceStatus;
    external: ServiceStatus;
  };
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    activeConnections: number;
    requestsPerMinute: number;
  };
}

export interface ServiceStatus {
  status: 'online' | 'offline' | 'degraded';
  responseTime: number;
  lastCheck: Date;
  errorCount: number;
}

export interface UserActivity {
  userId: string;
  username: string;
  action: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  metadata?: any;
}

export interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  isResolved: boolean;
  resolvedAt?: Date;
  metadata?: any;
}
```

#### 💻 1.2 建立監控服務
```typescript
// 📋 CHECKLIST - 建立 src/services/monitoringService.ts
import { doc, setDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { SystemHealth, UserActivity, SystemAlert } from '../types/monitoring';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

class MonitoringService {
  private healthCheckInterval: NodeJS.Timeout | null = null;

  // 開始健康檢查
  startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.collectSystemHealth();
        await this.saveHealthData(health);
        await this.checkAlerts(health);
      } catch (error) {
        console.error('健康檢查失敗:', error);
      }
    }, 60000); // 每分鐘檢查一次
  }

  // 停止健康檢查
  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // 收集系統健康數據
  private async collectSystemHealth(): Promise<SystemHealth> {
    const timestamp = new Date();
    
    // 檢查各服務狀態
    const services = {
      database: await this.checkDatabaseHealth(),
      websocket: await this.checkWebSocketHealth(),
      api: await this.checkApiHealth(),
      external: await this.checkExternalServicesHealth()
    };

    // 收集系統指標
    const metrics = {
      cpuUsage: this.getCpuUsage(),
      memoryUsage: this.getMemoryUsage(),
      diskUsage: await this.getDiskUsage(),
      activeConnections: this.getActiveConnections(),
      requestsPerMinute: await this.getRequestsPerMinute()
    };

    // 判斷整體狀態
    const status = this.determineOverallStatus(services, metrics);

    return {
      timestamp,
      status,
      services,
      metrics
    };
  }

  // 檢查資料庫健康狀態
  private async checkDatabaseHealth(): Promise<any> {
    try {
      const startTime = Date.now();
      await getDocs(query(collection(db, 'health'), limit(1)));
      const responseTime = Date.now() - startTime;

      return {
        status: 'online',
        responseTime,
        lastCheck: new Date(),
        errorCount: 0
      };
    } catch (error) {
      return {
        status: 'offline',
        responseTime: -1,
        lastCheck: new Date(),
        errorCount: 1
      };
    }
  }

  // 獲取 CPU 使用率
  private getCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    return Math.round(100 - (totalIdle / totalTick) * 100);
  }

  // 獲取記憶體使用率
  private getMemoryUsage(): number {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    return Math.round(((totalMem - freeMem) / totalMem) * 100);
  }

  // 記錄用戶活動
  async logUserActivity(activity: Omit<UserActivity, 'timestamp'>): Promise<void> {
    try {
      const activityData: UserActivity = {
        ...activity,
        timestamp: new Date()
      };

      const docRef = doc(collection(db, 'userActivities'));
      await setDoc(docRef, activityData);
    } catch (error) {
      console.error('記錄用戶活動失敗:', error);
    }
  }

  // 創建系統警報
  async createAlert(alert: Omit<SystemAlert, 'id' | 'timestamp' | 'isResolved'>): Promise<void> {
    try {
      const alertData: SystemAlert = {
        id: uuidv4(),
        ...alert,
        timestamp: new Date(),
        isResolved: false
      };

      const docRef = doc(db, 'systemAlerts', alertData.id);
      await setDoc(docRef, alertData);
    } catch (error) {
      console.error('創建警報失敗:', error);
    }
  }

  // 獲取系統統計
  async getSystemStats(): Promise<any> {
    try {
      // 獲取最近的健康數據
      const healthQuery = query(
        collection(db, 'systemHealth'),
        orderBy('timestamp', 'desc'),
        limit(24) // 最近24小時
      );
      
      const healthSnapshot = await getDocs(healthQuery);
      const healthData = healthSnapshot.docs.map(doc => doc.data());

      // 獲取用戶活動統計
      const activityQuery = query(
        collection(db, 'userActivities'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const activitySnapshot = await getDocs(activityQuery);
      const activityData = activitySnapshot.docs.map(doc => doc.data());

      return {
        healthHistory: healthData,
        recentActivity: activityData,
        summary: {
          totalUsers: await this.getTotalUsers(),
          activeUsers: await this.getActiveUsers(),
          totalRequests: await this.getTotalRequests(),
          errorRate: await this.getErrorRate()
        }
      };
    } catch (error) {
      console.error('獲取系統統計失敗:', error);
      throw error;
    }
  }

  // 輔助方法
  private async checkWebSocketHealth(): Promise<any> {
    // WebSocket 健康檢查邏輯
    return { status: 'online', responseTime: 50, lastCheck: new Date(), errorCount: 0 };
  }

  private async checkApiHealth(): Promise<any> {
    // API 健康檢查邏輯
    return { status: 'online', responseTime: 100, lastCheck: new Date(), errorCount: 0 };
  }

  private async checkExternalServicesHealth(): Promise<any> {
    // 外部服務健康檢查邏輯
    return { status: 'online', responseTime: 200, lastCheck: new Date(), errorCount: 0 };
  }

  private async getDiskUsage(): Promise<number> {
    // 磁碟使用率檢查邏輯
    return 45; // 模擬數據
  }

  private getActiveConnections(): number {
    // 活躍連接數檢查邏輯
    return 150; // 模擬數據
  }

  private async getRequestsPerMinute(): Promise<number> {
    // 每分鐘請求數檢查邏輯
    return 50; // 模擬數據
  }

  private determineOverallStatus(services: any, metrics: any): 'healthy' | 'warning' | 'critical' {
    // 狀態判斷邏輯
    if (metrics.cpuUsage > 90 || metrics.memoryUsage > 90) return 'critical';
    if (metrics.cpuUsage > 70 || metrics.memoryUsage > 70) return 'warning';
    return 'healthy';
  }

  private async saveHealthData(health: SystemHealth): Promise<void> {
    const docRef = doc(collection(db, 'systemHealth'));
    await setDoc(docRef, health);
  }

  private async checkAlerts(health: SystemHealth): Promise<void> {
    // 警報檢查邏輯
    if (health.status === 'critical') {
      await this.createAlert({
        type: 'error',
        title: '系統狀態異常',
        message: '系統資源使用率過高，需要立即處理'
      });
    }
  }

  private async getTotalUsers(): Promise<number> { return 100; }
  private async getActiveUsers(): Promise<number> { return 25; }
  private async getTotalRequests(): Promise<number> { return 10000; }
  private async getErrorRate(): Promise<number> { return 2.5; }
}

export const monitoringService = new MonitoringService();
```

### 🚨 第二步：管理面板組件
**位置**: frontend/src/ 目錄
**目標**: 建立系統管理介面
**🎯 用戶情境**: 🔴 ADVANCED

#### 💻 2.1 系統監控面板
```typescript
// 📋 CHECKLIST - 建立 src/components/SystemDashboard.tsx
import React, { useState, useEffect } from 'react';
import { SystemHealth, SystemAlert } from '../types/monitoring';

export const SystemDashboard: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 30000); // 每30秒更新
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      // 載入系統健康狀態
      const healthResponse = await fetch('/api/system/health');
      const healthData = await healthResponse.json();
      setHealth(healthData);

      // 載入警報
      const alertsResponse = await fetch('/api/system/alerts');
      const alertsData = await alertsResponse.json();
      setAlerts(alertsData);

      // 載入統計數據
      const statsResponse = await fetch('/api/system/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);
    } catch (error) {
      console.error('載入系統數據失敗:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '🟢';
      case 'offline': return '🔴';
      case 'degraded': return '🟡';
      default: return '⚪';
    }
  };

  if (!health || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">系統管理面板</h1>

        {/* 系統狀態總覽 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">系統狀態</h3>
            <div className={`text-2xl font-bold ${getStatusColor(health.status)}`}>
              {health.status.toUpperCase()}
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">CPU 使用率</h3>
            <div className="text-2xl font-bold text-white">
              {health.metrics.cpuUsage}%
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${health.metrics.cpuUsage}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">記憶體使用</h3>
            <div className="text-2xl font-bold text-white">
              {health.metrics.memoryUsage}%
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${health.metrics.memoryUsage}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">活躍連接</h3>
            <div className="text-2xl font-bold text-white">
              {health.metrics.activeConnections}
            </div>
          </div>
        </div>

        {/* 服務狀態 */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">服務狀態</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(health.services).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <div className="text-white font-medium capitalize">{service}</div>
                  <div className="text-sm text-gray-400">
                    {status.responseTime}ms
                  </div>
                </div>
                <div className="text-2xl">
                  {getStatusIcon(status.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 系統警報 */}
        {alerts.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">系統警報</h3>
            <div className="space-y-3">
              {alerts.slice(0, 5).map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <div className="text-white font-medium">{alert.title}</div>
                    <div className="text-sm text-gray-400">{alert.message}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    alert.type === 'error' ? 'bg-red-600 text-white' :
                    alert.type === 'warning' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {alert.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 統計摘要 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">總用戶數</h3>
            <div className="text-2xl font-bold text-white">
              {stats.summary.totalUsers}
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">活躍用戶</h3>
            <div className="text-2xl font-bold text-white">
              {stats.summary.activeUsers}
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">總請求數</h3>
            <div className="text-2xl font-bold text-white">
              {stats.summary.totalRequests.toLocaleString()}
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">錯誤率</h3>
            <div className="text-2xl font-bold text-white">
              {stats.summary.errorRate}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## ✅ 完成驗證

### 🧪 **功能測試**
```markdown
測試清單：
- [ ] 系統監控數據準確
- [ ] 警報機制正常運作
- [ ] 用戶活動記錄完整
- [ ] 管理介面響應正常
- [ ] 權限控制機制有效
```

### 🔒 **安全檢查**
- [ ] 管理權限驗證
- [ ] 敏感數據保護
- [ ] 日誌安全存儲
- [ ] 訪問控制機制
- [ ] 審計追蹤完整

---

**🎉 恭喜！** 系統管理模組完成，現在擁有完整的監控和管理功能！
