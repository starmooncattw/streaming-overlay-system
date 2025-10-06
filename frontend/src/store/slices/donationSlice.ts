import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { donationService } from '../../services/donationService';

// 類型定義
export interface Donation {
  id: string;
  streamerId: string;
  donorName: string;
  amount: number;
  currency: string;
  message: string;
  timestamp: string;
  isAnonymous: boolean;
  platform: 'youtube' | 'twitch' | 'api';
}

export interface DonationGoal {
  id: string;
  streamerId: string;
  title: string;
  target: number;
  current: number;
  currency: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface DonationStats {
  totalAmount: number;
  totalCount: number;
  todayAmount: number;
  todayCount: number;
  monthlyAmount: number;
  monthlyCount: number;
  currency: string;
  topDonation: Donation | null;
  recentDonations: Donation[];
}

export interface DonationState {
  donations: Donation[];
  recentDonations: Donation[];
  stats: DonationStats | null;
  goals: DonationGoal[];
  activeGoal: DonationGoal | null;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  filters: {
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    platform?: string;
  };
}

// 初始狀態
const initialState: DonationState = {
  donations: [],
  recentDonations: [],
  stats: null,
  goals: [],
  activeGoal: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  },
  filters: {},
};

// 異步 Actions
export const fetchDonations = createAsyncThunk(
  'donation/fetchDonations',
  async (params: {
    streamerId: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await donationService.getDonations(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '獲取斗內記錄失敗');
    }
  }
);

export const createDonation = createAsyncThunk(
  'donation/createDonation',
  async (donationData: {
    streamerId: string;
    donorName: string;
    amount: number;
    currency: string;
    message?: string;
    isAnonymous?: boolean;
  }, { rejectWithValue }) => {
    try {
      const response = await donationService.createDonation(donationData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '創建斗內記錄失敗');
    }
  }
);

export const fetchDonationStats = createAsyncThunk(
  'donation/fetchDonationStats',
  async (streamerId: string, { rejectWithValue }) => {
    try {
      const response = await donationService.getDonationStats(streamerId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '獲取斗內統計失敗');
    }
  }
);

export const fetchDonationGoals = createAsyncThunk(
  'donation/fetchDonationGoals',
  async (streamerId: string, { rejectWithValue }) => {
    try {
      const response = await donationService.getDonationGoals(streamerId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '獲取斗內目標失敗');
    }
  }
);

export const createDonationGoal = createAsyncThunk(
  'donation/createDonationGoal',
  async (goalData: {
    streamerId: string;
    title: string;
    target: number;
    currency: string;
    endDate?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await donationService.createDonationGoal(goalData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '創建斗內目標失敗');
    }
  }
);

export const updateDonationGoal = createAsyncThunk(
  'donation/updateDonationGoal',
  async (data: {
    goalId: string;
    updates: Partial<DonationGoal>;
  }, { rejectWithValue }) => {
    try {
      const response = await donationService.updateDonationGoal(data.goalId, data.updates);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '更新斗內目標失敗');
    }
  }
);

// Slice
const donationSlice = createSlice({
  name: 'donation',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addRecentDonation: (state, action: PayloadAction<Donation>) => {
      // 添加新的斗內到最近列表
      state.recentDonations.unshift(action.payload);
      // 保持最近斗內列表最多 10 項
      if (state.recentDonations.length > 10) {
        state.recentDonations = state.recentDonations.slice(0, 10);
      }
      
      // 更新統計
      if (state.stats) {
        state.stats.totalAmount += action.payload.amount;
        state.stats.totalCount += 1;
        
        // 檢查是否是今天的斗內
        const today = new Date().toDateString();
        const donationDate = new Date(action.payload.timestamp).toDateString();
        if (today === donationDate) {
          state.stats.todayAmount += action.payload.amount;
          state.stats.todayCount += 1;
        }
        
        // 更新最高斗內
        if (!state.stats.topDonation || action.payload.amount > state.stats.topDonation.amount) {
          state.stats.topDonation = action.payload;
        }
      }
      
      // 更新活躍目標進度
      if (state.activeGoal) {
        state.activeGoal.current += action.payload.amount;
      }
    },
    setFilters: (state, action: PayloadAction<Partial<DonationState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setActiveGoal: (state, action: PayloadAction<DonationGoal | null>) => {
      state.activeGoal = action.payload;
    },
    updateGoalProgress: (state, action: PayloadAction<{ goalId: string; amount: number }>) => {
      const goal = state.goals.find(g => g.id === action.payload.goalId);
      if (goal) {
        goal.current += action.payload.amount;
      }
      if (state.activeGoal && state.activeGoal.id === action.payload.goalId) {
        state.activeGoal.current += action.payload.amount;
      }
    },
    resetDonations: (state) => {
      state.donations = [];
      state.recentDonations = [];
      state.stats = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Donations
    builder
      .addCase(fetchDonations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDonations.fulfilled, (state, action) => {
        state.loading = false;
        state.donations = action.payload.donations;
        state.pagination = action.payload.pagination;
        if (action.payload.summary) {
          // 更新統計摘要
          if (state.stats) {
            state.stats.totalAmount = action.payload.summary.totalAmount;
            state.stats.totalCount = action.payload.summary.totalCount;
          }
        }
      })
      .addCase(fetchDonations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Donation
    builder
      .addCase(createDonation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDonation.fulfilled, (state, action) => {
        state.loading = false;
        // 添加新斗內到列表開頭
        state.donations.unshift(action.payload);
        // 同時添加到最近斗內
        donationSlice.caseReducers.addRecentDonation(state, { 
          payload: action.payload, 
          type: 'donation/addRecentDonation' 
        });
      })
      .addCase(createDonation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Donation Stats
    builder
      .addCase(fetchDonationStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDonationStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.recentDonations = action.payload.recentDonations || [];
      })
      .addCase(fetchDonationStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Donation Goals
    builder
      .addCase(fetchDonationGoals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDonationGoals.fulfilled, (state, action) => {
        state.loading = false;
        state.goals = action.payload;
        // 設定活躍目標（第一個活躍的目標）
        const activeGoal = action.payload.find(goal => goal.isActive);
        if (activeGoal) {
          state.activeGoal = activeGoal;
        }
      })
      .addCase(fetchDonationGoals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Donation Goal
    builder
      .addCase(createDonationGoal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDonationGoal.fulfilled, (state, action) => {
        state.loading = false;
        state.goals.push(action.payload);
        // 如果是活躍目標且沒有其他活躍目標，設為當前活躍目標
        if (action.payload.isActive && !state.activeGoal) {
          state.activeGoal = action.payload;
        }
      })
      .addCase(createDonationGoal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Donation Goal
    builder
      .addCase(updateDonationGoal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDonationGoal.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.goals.findIndex(goal => goal.id === action.payload.id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
        // 更新活躍目標
        if (state.activeGoal && state.activeGoal.id === action.payload.id) {
          state.activeGoal = action.payload;
        }
      })
      .addCase(updateDonationGoal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  addRecentDonation,
  setFilters,
  clearFilters,
  setActiveGoal,
  updateGoalProgress,
  resetDonations,
} = donationSlice.actions;

export default donationSlice.reducer;
