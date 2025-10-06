import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { firebaseAuthService, RegisterData, LoginData, UserProfile } from '../../services/firebaseAuthService';

// 用戶狀態介面
export interface FirebaseUser {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  role: 'admin' | 'streamer' | 'viewer';
  avatar?: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: any; // Firebase Timestamp
  lastLoginAt?: any; // Firebase Timestamp
}

// 認證狀態介面
export interface FirebaseAuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  initializing: boolean;
}

// 初始狀態
const initialState: FirebaseAuthState = {
  user: null,
  profile: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  initializing: true
};

// 異步操作：註冊
export const firebaseRegister = createAsyncThunk(
  'firebaseAuth/register',
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const result = await firebaseAuthService.register(data);
      return {
        user: {
          uid: result.user.uid,
          email: result.user.email || '',
          username: result.profile.username,
          displayName: result.profile.displayName,
          role: result.profile.role,
          avatar: result.profile.avatar,
          emailVerified: result.user.emailVerified,
          isActive: result.profile.isActive,
          createdAt: result.profile.createdAt,
          lastLoginAt: result.profile.lastLoginAt
        },
        profile: result.profile
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 異步操作：登入
export const firebaseLogin = createAsyncThunk(
  'firebaseAuth/login',
  async (data: LoginData, { rejectWithValue }) => {
    try {
      const result = await firebaseAuthService.login(data);
      return {
        user: {
          uid: result.user.uid,
          email: result.user.email || '',
          username: result.profile.username,
          displayName: result.profile.displayName,
          role: result.profile.role,
          avatar: result.profile.avatar,
          emailVerified: result.user.emailVerified,
          isActive: result.profile.isActive,
          createdAt: result.profile.createdAt,
          lastLoginAt: result.profile.lastLoginAt
        },
        profile: result.profile
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 異步操作：登出
export const firebaseLogout = createAsyncThunk(
  'firebaseAuth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await firebaseAuthService.logout();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 異步操作：更新用戶資料
export const updateFirebaseProfile = createAsyncThunk(
  'firebaseAuth/updateProfile',
  async (updates: Partial<UserProfile>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { firebaseAuth: FirebaseAuthState };
      const uid = state.firebaseAuth.user?.uid;
      
      if (!uid) {
        throw new Error('用戶未登入');
      }

      await firebaseAuthService.updateUserProfile(uid, updates);
      
      // 獲取更新後的用戶資料
      const updatedProfile = await firebaseAuthService.getUserProfile(uid);
      return updatedProfile;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 異步操作：更改密碼
export const changeFirebasePassword = createAsyncThunk(
  'firebaseAuth/changePassword',
  async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      await firebaseAuthService.changePassword(currentPassword, newPassword);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 異步操作：發送密碼重設郵件
export const sendFirebasePasswordReset = createAsyncThunk(
  'firebaseAuth/sendPasswordReset',
  async (email: string, { rejectWithValue }) => {
    try {
      await firebaseAuthService.sendPasswordReset(email);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// 異步操作：重新發送郵件驗證
export const resendFirebaseEmailVerification = createAsyncThunk(
  'firebaseAuth/resendEmailVerification',
  async (_, { rejectWithValue }) => {
    try {
      await firebaseAuthService.resendEmailVerification();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Firebase 認證 Slice
const firebaseAuthSlice = createSlice({
  name: 'firebaseAuth',
  initialState,
  reducers: {
    // 設置用戶
    setFirebaseUser: (state, action: PayloadAction<{ user: FirebaseUser; profile: UserProfile }>) => {
      state.user = action.payload.user;
      state.profile = action.payload.profile;
      state.isAuthenticated = true;
      state.error = null;
    },
    
    // 清除用戶
    clearFirebaseUser: (state) => {
      state.user = null;
      state.profile = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    
    // 設置載入狀態
    setFirebaseLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // 設置初始化狀態
    setFirebaseInitializing: (state, action: PayloadAction<boolean>) => {
      state.initializing = action.payload;
    },
    
    // 清除錯誤
    clearFirebaseError: (state) => {
      state.error = null;
    },
    
    // 更新用戶資料
    updateFirebaseUser: (state, action: PayloadAction<Partial<FirebaseUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    // 註冊
    builder
      .addCase(firebaseRegister.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(firebaseRegister.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(firebaseRegister.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.user = null;
        state.profile = null;
        state.isAuthenticated = false;
      });

    // 登入
    builder
      .addCase(firebaseLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(firebaseLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(firebaseLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.user = null;
        state.profile = null;
        state.isAuthenticated = false;
      });

    // 登出
    builder
      .addCase(firebaseLogout.pending, (state) => {
        state.loading = true;
      })
      .addCase(firebaseLogout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.profile = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(firebaseLogout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 更新用戶資料
    builder
      .addCase(updateFirebaseProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFirebaseProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        if (state.user) {
          state.user.username = action.payload.username;
          state.user.displayName = action.payload.displayName;
          state.user.role = action.payload.role;
          state.user.avatar = action.payload.avatar;
        }
      })
      .addCase(updateFirebaseProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 更改密碼
    builder
      .addCase(changeFirebasePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changeFirebasePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(changeFirebasePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 發送密碼重設郵件
    builder
      .addCase(sendFirebasePasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendFirebasePasswordReset.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(sendFirebasePasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 重新發送郵件驗證
    builder
      .addCase(resendFirebaseEmailVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendFirebaseEmailVerification.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resendFirebaseEmailVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

// 導出 actions
export const {
  setFirebaseUser,
  clearFirebaseUser,
  setFirebaseLoading,
  setFirebaseInitializing,
  clearFirebaseError,
  updateFirebaseUser
} = firebaseAuthSlice.actions;

// 導出 reducer
export default firebaseAuthSlice.reducer;
