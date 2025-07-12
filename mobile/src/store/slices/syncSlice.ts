/**
 * @file store/slices/syncSlice.ts
 * @description Sync and offline queue state management
 */

import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {OfflineQueue} from '@/types';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  pendingCount: number;
  failedCount: number;
  syncProgress: number;
  error: string | null;
}

const initialState: SyncState = {
  isOnline: true,
  isSyncing: false,
  lastSync: null,
  pendingCount: 0,
  failedCount: 0,
  syncProgress: 0,
  error: null,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
      if (action.payload) {
        state.syncProgress = 0;
      }
    },
    setLastSync: (state, action: PayloadAction<string>) => {
      state.lastSync = action.payload;
    },
    setQueueCounts: (
      state,
      action: PayloadAction<{pending: number; failed: number}>
    ) => {
      state.pendingCount = action.payload.pending;
      state.failedCount = action.payload.failed;
    },
    setSyncProgress: (state, action: PayloadAction<number>) => {
      state.syncProgress = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateFromQueue: (state, action: PayloadAction<OfflineQueue>) => {
      state.pendingCount = action.payload.pending.length;
      state.failedCount = action.payload.failed.length;
      state.isSyncing = action.payload.syncing;
      state.lastSync = action.payload.lastSync || null;
    },
  },
});

export const {
  setOnlineStatus,
  setSyncing,
  setLastSync,
  setQueueCounts,
  setSyncProgress,
  setError,
  updateFromQueue,
} = syncSlice.actions;

export default syncSlice.reducer;