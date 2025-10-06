import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { streamService } from '../../services/streamService';

// 類型定義
export interface StreamInfo {
  streamerId: string;
  title: string;
  description: string;
  isLive: boolean;
  viewerCount: number;
  startTime: string;
  category: string;
  tags: string[];
  overlaySettings: {
    showDonations: boolean;
    showViewerCount: boolean;
    showLatestFollower: boolean;
    theme: string;
  };
}

export interface StreamStats {
  streamerId: string;
  timestamp: string;
  viewers: {
    current: number;
    peak: number;
    total: number;
  };
  donations: {
    todayTotal: number;
    todayCount: number;
    monthlyTotal: number;
    currency: string;
  };
  engagement: {
    chatMessages: number;
    likes: number;
    shares: number;
  };
  streamInfo: {
    duration: number;
    isLive: boolean;
    quality: string;
    bitrate: number;
  };
}

export interface StreamState {
  currentStream: StreamInfo | null;
  stats: StreamStats | null;
  connectedViewers: number;
  isStreaming: boolean;
  streamQuality: string;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// 初始狀態
const initialState: StreamState = {
  currentStream: null,
  stats: null,
  connectedViewers: 0,
  isStreaming: false,
  streamQuality: '1080p',
  loading: false,
  error: null,
  lastUpdated: null,
};

// 異步 Actions
export const fetchStreamInfo = createAsyncThunk(
  'stream/fetchStreamInfo',
  async (streamerId: string, { rejectWithValue }) => {
    try {
      const response = await streamService.getStreamInfo(streamerId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '獲取直播資訊失敗');
    }
  }
);

export const updateStreamSettings = createAsyncThunk(
  'stream/updateStreamSettings',
  async (data: { 
    streamerId: string; 
    settings: Partial<StreamInfo> 
  }, { rejectWithValue }) => {
    try {
      const response = await streamService.updateStreamSettings(data.streamerId, data.settings);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '更新直播設定失敗');
    }
  }
);

export const fetchStreamStats = createAsyncThunk(
  'stream/fetchStreamStats',
  async (streamerId: string, { rejectWithValue }) => {
    try {
      const response = await streamService.getStreamStats(streamerId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '獲取直播統計失敗');
    }
  }
);

export const startStream = createAsyncThunk(
  'stream/startStream',
  async (streamerId: string, { rejectWithValue }) => {
    try {
      // 這裡應該調用實際的開始直播 API
      const response = await streamService.startStream(streamerId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '開始直播失敗');
    }
  }
);

export const stopStream = createAsyncThunk(
  'stream/stopStream',
  async (streamerId: string, { rejectWithValue }) => {
    try {
      // 這裡應該調用實際的停止直播 API
      const response = await streamService.stopStream(streamerId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '停止直播失敗');
    }
  }
);

// Slice
const streamSlice = createSlice({
  name: 'stream',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setConnectedViewers: (state, action: PayloadAction<number>) => {
      state.connectedViewers = action.payload;
    },
    updateViewerCount: (state, action: PayloadAction<number>) => {
      if (state.currentStream) {
        state.currentStream.viewerCount = action.payload;
      }
      if (state.stats) {
        state.stats.viewers.current = action.payload;
      }
    },
    setStreamQuality: (state, action: PayloadAction<string>) => {
      state.streamQuality = action.payload;
    },
    updateStreamStatus: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
      if (state.currentStream) {
        state.currentStream.isLive = action.payload;
      }
    },
    updateStats: (state, action: PayloadAction<Partial<StreamStats>>) => {
      if (state.stats) {
        state.stats = { ...state.stats, ...action.payload };
      }
      state.lastUpdated = new Date().toISOString();
    },
    resetStream: (state) => {
      state.currentStream = null;
      state.stats = null;
      state.connectedViewers = 0;
      state.isStreaming = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Stream Info
    builder
      .addCase(fetchStreamInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStreamInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.currentStream = action.payload;
        state.isStreaming = action.payload.isLive;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchStreamInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Stream Settings
    builder
      .addCase(updateStreamSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStreamSettings.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentStream) {
          state.currentStream = { ...state.currentStream, ...action.payload };
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateStreamSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Stream Stats
    builder
      .addCase(fetchStreamStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStreamStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.connectedViewers = action.payload.viewers.current;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchStreamStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Start Stream
    builder
      .addCase(startStream.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startStream.fulfilled, (state, action) => {
        state.loading = false;
        state.isStreaming = true;
        if (state.currentStream) {
          state.currentStream.isLive = true;
          state.currentStream.startTime = new Date().toISOString();
        }
      })
      .addCase(startStream.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Stop Stream
    builder
      .addCase(stopStream.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(stopStream.fulfilled, (state, action) => {
        state.loading = false;
        state.isStreaming = false;
        if (state.currentStream) {
          state.currentStream.isLive = false;
        }
      })
      .addCase(stopStream.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setConnectedViewers,
  updateViewerCount,
  setStreamQuality,
  updateStreamStatus,
  updateStats,
  resetStream,
} = streamSlice.actions;

export default streamSlice.reducer;
