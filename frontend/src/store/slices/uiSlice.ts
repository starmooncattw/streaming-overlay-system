import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 類型定義
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: string;
  read: boolean;
}

export interface Modal {
  id: string;
  type: 'confirm' | 'alert' | 'custom';
  title: string;
  content: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export interface UIState {
  // 側邊欄狀態
  sidebarCollapsed: boolean;
  sidebarMobile: boolean;
  
  // 主題設定
  theme: 'light' | 'dark' | 'auto';
  
  // 載入狀態
  globalLoading: boolean;
  loadingMessage: string;
  
  // 通知系統
  notifications: Notification[];
  unreadNotifications: number;
  
  // 模態框系統
  modals: Modal[];
  
  // 頁面狀態
  currentPage: string;
  pageTitle: string;
  breadcrumbs: Array<{ label: string; path?: string }>;
  
  // 表單狀態
  unsavedChanges: boolean;
  
  // 連接狀態
  isOnline: boolean;
  websocketConnected: boolean;
  
  // 設定面板
  settingsPanelOpen: boolean;
  settingsActiveTab: string;
  
  // 搜尋狀態
  searchQuery: string;
  searchResults: any[];
  searchLoading: boolean;
  
  // 篩選器
  activeFilters: Record<string, any>;
  
  // 視窗大小
  windowSize: {
    width: number;
    height: number;
  };
  isMobile: boolean;
  
  // 錯誤狀態
  lastError: string | null;
  errorDetails: any;
}

// 初始狀態
const initialState: UIState = {
  sidebarCollapsed: false,
  sidebarMobile: false,
  theme: 'dark',
  globalLoading: false,
  loadingMessage: '',
  notifications: [],
  unreadNotifications: 0,
  modals: [],
  currentPage: '',
  pageTitle: '',
  breadcrumbs: [],
  unsavedChanges: false,
  isOnline: navigator.onLine,
  websocketConnected: false,
  settingsPanelOpen: false,
  settingsActiveTab: 'general',
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  activeFilters: {},
  windowSize: {
    width: window.innerWidth,
    height: window.innerHeight,
  },
  isMobile: window.innerWidth < 768,
  lastError: null,
  errorDetails: null,
};

// Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // 側邊欄控制
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setSidebarMobile: (state, action: PayloadAction<boolean>) => {
      state.sidebarMobile = action.payload;
    },
    
    // 主題控制
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    
    // 載入狀態
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
      if (!action.payload) {
        state.loadingMessage = '';
      }
    },
    setLoadingMessage: (state, action: PayloadAction<string>) => {
      state.loadingMessage = action.payload;
    },
    
    // 通知系統
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      state.notifications.unshift(notification);
      state.unreadNotifications += 1;
      
      // 保持通知列表最多 50 項
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        state.unreadNotifications = Math.max(0, state.unreadNotifications - 1);
      }
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadNotifications = Math.max(0, state.unreadNotifications - 1);
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(n => n.read = true);
      state.unreadNotifications = 0;
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadNotifications = 0;
    },
    
    // 模態框系統
    showModal: (state, action: PayloadAction<Omit<Modal, 'id'>>) => {
      const modal: Modal = {
        ...action.payload,
        id: `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      state.modals.push(modal);
    },
    hideModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(m => m.id !== action.payload);
    },
    hideAllModals: (state) => {
      state.modals = [];
    },
    
    // 頁面狀態
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload;
    },
    setPageTitle: (state, action: PayloadAction<string>) => {
      state.pageTitle = action.payload;
      document.title = `${action.payload} - Streaming Overlay System`;
    },
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; path?: string }>>) => {
      state.breadcrumbs = action.payload;
    },
    
    // 表單狀態
    setUnsavedChanges: (state, action: PayloadAction<boolean>) => {
      state.unsavedChanges = action.payload;
    },
    
    // 連接狀態
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setWebsocketConnected: (state, action: PayloadAction<boolean>) => {
      state.websocketConnected = action.payload;
    },
    
    // 設定面板
    toggleSettingsPanel: (state) => {
      state.settingsPanelOpen = !state.settingsPanelOpen;
    },
    setSettingsPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.settingsPanelOpen = action.payload;
    },
    setSettingsActiveTab: (state, action: PayloadAction<string>) => {
      state.settingsActiveTab = action.payload;
    },
    
    // 搜尋功能
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSearchResults: (state, action: PayloadAction<any[]>) => {
      state.searchResults = action.payload;
    },
    setSearchLoading: (state, action: PayloadAction<boolean>) => {
      state.searchLoading = action.payload;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.searchLoading = false;
    },
    
    // 篩選器
    setFilter: (state, action: PayloadAction<{ key: string; value: any }>) => {
      state.activeFilters[action.payload.key] = action.payload.value;
    },
    removeFilter: (state, action: PayloadAction<string>) => {
      delete state.activeFilters[action.payload];
    },
    clearAllFilters: (state) => {
      state.activeFilters = {};
    },
    
    // 視窗大小
    setWindowSize: (state, action: PayloadAction<{ width: number; height: number }>) => {
      state.windowSize = action.payload;
      state.isMobile = action.payload.width < 768;
      
      // 在手機版自動收起側邊欄
      if (state.isMobile && !state.sidebarCollapsed) {
        state.sidebarCollapsed = true;
      }
    },
    
    // 錯誤處理
    setError: (state, action: PayloadAction<{ message: string; details?: any }>) => {
      state.lastError = action.payload.message;
      state.errorDetails = action.payload.details || null;
      
      // 同時添加錯誤通知
      const errorNotification: Notification = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'error',
        title: '錯誤',
        message: action.payload.message,
        timestamp: new Date().toISOString(),
        read: false,
        duration: 5000,
      };
      
      state.notifications.unshift(errorNotification);
      state.unreadNotifications += 1;
    },
    clearError: (state) => {
      state.lastError = null;
      state.errorDetails = null;
    },
    
    // 重置 UI 狀態
    resetUI: (state) => {
      state.notifications = [];
      state.unreadNotifications = 0;
      state.modals = [];
      state.unsavedChanges = false;
      state.settingsPanelOpen = false;
      state.searchQuery = '';
      state.searchResults = [];
      state.searchLoading = false;
      state.activeFilters = {};
      state.lastError = null;
      state.errorDetails = null;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setSidebarMobile,
  setTheme,
  setGlobalLoading,
  setLoadingMessage,
  addNotification,
  removeNotification,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
  showModal,
  hideModal,
  hideAllModals,
  setCurrentPage,
  setPageTitle,
  setBreadcrumbs,
  setUnsavedChanges,
  setOnlineStatus,
  setWebsocketConnected,
  toggleSettingsPanel,
  setSettingsPanelOpen,
  setSettingsActiveTab,
  setSearchQuery,
  setSearchResults,
  setSearchLoading,
  clearSearch,
  setFilter,
  removeFilter,
  clearAllFilters,
  setWindowSize,
  setError,
  clearError,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;
