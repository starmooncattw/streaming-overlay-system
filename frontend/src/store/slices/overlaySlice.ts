import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { overlayService } from '../../services/overlayService';

// 類型定義
export interface OverlayComponent {
  id: string;
  type: 'donationAlert' | 'viewerCount' | 'latestFollower' | 'chatBox' | 'donationGoal' | 'custom';
  enabled: boolean;
  position: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  };
  style: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
    opacity?: number;
  };
  animation?: {
    type: 'none' | 'fadeIn' | 'slideIn' | 'bounce' | 'pulse';
    duration: number;
    delay?: number;
  };
  settings: Record<string, any>;
}

export interface DonationAlertSettings {
  minAmount: number;
  duration: number;
  sound: string;
  template: string;
  showAmount: boolean;
  showMessage: boolean;
  maxMessageLength: number;
}

export interface ViewerCountSettings {
  format: string;
  updateInterval: number;
  showIcon: boolean;
}

export interface ChatBoxSettings {
  maxMessages: number;
  messageTimeout: number;
  showUsernames: boolean;
  filterBadWords: boolean;
  allowedRoles: string[];
}

export interface DonationGoalSettings {
  target: number;
  current: number;
  currency: string;
  showPercentage: boolean;
  showAmount: boolean;
  resetDaily: boolean;
}

export interface OverlayConfig {
  streamerId: string;
  theme: 'light' | 'dark' | 'custom';
  components: OverlayComponent[];
  customCSS: string;
  globalSettings: {
    fontFamily: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    borderRadius: number;
  };
  lastUpdated: string;
}

export interface OverlayState {
  config: OverlayConfig | null;
  previewMode: boolean;
  selectedComponent: string | null;
  dragMode: boolean;
  loading: boolean;
  error: string | null;
  unsavedChanges: boolean;
  templates: OverlayComponent[];
}

// 初始狀態
const initialState: OverlayState = {
  config: null,
  previewMode: false,
  selectedComponent: null,
  dragMode: false,
  loading: false,
  error: null,
  unsavedChanges: false,
  templates: [],
};

// 異步 Actions
export const fetchOverlayConfig = createAsyncThunk(
  'overlay/fetchOverlayConfig',
  async (streamerId: string, { rejectWithValue }) => {
    try {
      const response = await overlayService.getOverlayConfig(streamerId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '獲取疊加層配置失敗');
    }
  }
);

export const updateOverlayConfig = createAsyncThunk(
  'overlay/updateOverlayConfig',
  async (data: {
    streamerId: string;
    config: Partial<OverlayConfig>;
  }, { rejectWithValue }) => {
    try {
      const response = await overlayService.updateOverlayConfig(data.streamerId, data.config);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '更新疊加層配置失敗');
    }
  }
);

export const saveOverlayConfig = createAsyncThunk(
  'overlay/saveOverlayConfig',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { overlay: OverlayState };
      const config = state.overlay.config;
      
      if (!config) {
        throw new Error('沒有配置可保存');
      }
      
      const response = await overlayService.updateOverlayConfig(config.streamerId, config);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '保存疊加層配置失敗');
    }
  }
);

export const fetchOverlayTemplates = createAsyncThunk(
  'overlay/fetchOverlayTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await overlayService.getOverlayTemplates();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '獲取疊加層模板失敗');
    }
  }
);

// Slice
const overlaySlice = createSlice({
  name: 'overlay',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPreviewMode: (state, action: PayloadAction<boolean>) => {
      state.previewMode = action.payload;
    },
    setSelectedComponent: (state, action: PayloadAction<string | null>) => {
      state.selectedComponent = action.payload;
    },
    setDragMode: (state, action: PayloadAction<boolean>) => {
      state.dragMode = action.payload;
    },
    addComponent: (state, action: PayloadAction<OverlayComponent>) => {
      if (state.config) {
        state.config.components.push(action.payload);
        state.unsavedChanges = true;
      }
    },
    updateComponent: (state, action: PayloadAction<{
      id: string;
      updates: Partial<OverlayComponent>;
    }>) => {
      if (state.config) {
        const index = state.config.components.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.config.components[index] = {
            ...state.config.components[index],
            ...action.payload.updates
          };
          state.unsavedChanges = true;
        }
      }
    },
    removeComponent: (state, action: PayloadAction<string>) => {
      if (state.config) {
        state.config.components = state.config.components.filter(
          c => c.id !== action.payload
        );
        state.unsavedChanges = true;
        
        // 如果刪除的是選中的組件，清除選擇
        if (state.selectedComponent === action.payload) {
          state.selectedComponent = null;
        }
      }
    },
    moveComponent: (state, action: PayloadAction<{
      id: string;
      position: { x: number; y: number };
    }>) => {
      if (state.config) {
        const component = state.config.components.find(c => c.id === action.payload.id);
        if (component) {
          component.position = action.payload.position;
          state.unsavedChanges = true;
        }
      }
    },
    resizeComponent: (state, action: PayloadAction<{
      id: string;
      size: { width: number; height: number };
    }>) => {
      if (state.config) {
        const component = state.config.components.find(c => c.id === action.payload.id);
        if (component) {
          component.size = action.payload.size;
          state.unsavedChanges = true;
        }
      }
    },
    updateTheme: (state, action: PayloadAction<'light' | 'dark' | 'custom'>) => {
      if (state.config) {
        state.config.theme = action.payload;
        state.unsavedChanges = true;
      }
    },
    updateGlobalSettings: (state, action: PayloadAction<Partial<OverlayConfig['globalSettings']>>) => {
      if (state.config) {
        state.config.globalSettings = {
          ...state.config.globalSettings,
          ...action.payload
        };
        state.unsavedChanges = true;
      }
    },
    updateCustomCSS: (state, action: PayloadAction<string>) => {
      if (state.config) {
        state.config.customCSS = action.payload;
        state.unsavedChanges = true;
      }
    },
    duplicateComponent: (state, action: PayloadAction<string>) => {
      if (state.config) {
        const component = state.config.components.find(c => c.id === action.payload);
        if (component) {
          const duplicated: OverlayComponent = {
            ...component,
            id: `${component.id}-copy-${Date.now()}`,
            position: {
              x: component.position.x + 20,
              y: component.position.y + 20
            }
          };
          state.config.components.push(duplicated);
          state.unsavedChanges = true;
        }
      }
    },
    resetToDefaults: (state) => {
      if (state.config) {
        // 重置為預設配置
        state.config.components = [];
        state.config.theme = 'dark';
        state.config.customCSS = '';
        state.config.globalSettings = {
          fontFamily: 'Arial, sans-serif',
          primaryColor: '#667eea',
          secondaryColor: '#764ba2',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: 8
        };
        state.unsavedChanges = true;
        state.selectedComponent = null;
      }
    },
    markSaved: (state) => {
      state.unsavedChanges = false;
      if (state.config) {
        state.config.lastUpdated = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Overlay Config
    builder
      .addCase(fetchOverlayConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverlayConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.config = action.payload;
        state.unsavedChanges = false;
      })
      .addCase(fetchOverlayConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Overlay Config
    builder
      .addCase(updateOverlayConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOverlayConfig.fulfilled, (state, action) => {
        state.loading = false;
        if (state.config) {
          state.config = { ...state.config, ...action.payload };
          state.config.lastUpdated = new Date().toISOString();
        }
        state.unsavedChanges = false;
      })
      .addCase(updateOverlayConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Save Overlay Config
    builder
      .addCase(saveOverlayConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveOverlayConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.unsavedChanges = false;
        if (state.config) {
          state.config.lastUpdated = new Date().toISOString();
        }
      })
      .addCase(saveOverlayConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Overlay Templates
    builder
      .addCase(fetchOverlayTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverlayTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload;
      })
      .addCase(fetchOverlayTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setPreviewMode,
  setSelectedComponent,
  setDragMode,
  addComponent,
  updateComponent,
  removeComponent,
  moveComponent,
  resizeComponent,
  updateTheme,
  updateGlobalSettings,
  updateCustomCSS,
  duplicateComponent,
  resetToDefaults,
  markSaved,
} = overlaySlice.actions;

export default overlaySlice.reducer;
