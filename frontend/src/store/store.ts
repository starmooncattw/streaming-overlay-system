import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import firebaseAuthSlice from './slices/firebaseAuthSlice';
import streamSlice from './slices/streamSlice';
import donationSlice from './slices/donationSlice';
import overlaySlice from './slices/overlaySlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    firebaseAuth: firebaseAuthSlice,
    stream: streamSlice,
    donation: donationSlice,
    overlay: overlaySlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
