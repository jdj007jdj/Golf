/**
 * @file store/slices/appSlice.ts
 * @description App-wide state management
 */

import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface AppState {
  isInitialized: boolean;
  isOnline: boolean;
  theme: 'light' | 'dark';
  units: 'metric' | 'imperial';
  notifications: {
    enabled: boolean;
    roundReminders: boolean;
    friendRequests: boolean;
    achievements: boolean;
  };
  permissions: {
    location: 'granted' | 'denied' | 'not-determined';
    camera: 'granted' | 'denied' | 'not-determined';
    notifications: 'granted' | 'denied' | 'not-determined';
  };
  error: string | null;
}

const initialState: AppState = {
  isInitialized: false,
  isOnline: true,
  theme: 'light',
  units: 'imperial',
  notifications: {
    enabled: true,
    roundReminders: true,
    friendRequests: true,
    achievements: true,
  },
  permissions: {
    location: 'not-determined',
    camera: 'not-determined',
    notifications: 'not-determined',
  },
  error: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setUnits: (state, action: PayloadAction<'metric' | 'imperial'>) => {
      state.units = action.payload;
    },
    updateNotificationSettings: (
      state,
      action: PayloadAction<Partial<AppState['notifications']>>
    ) => {
      state.notifications = {...state.notifications, ...action.payload};
    },
    updatePermissions: (
      state,
      action: PayloadAction<Partial<AppState['permissions']>>
    ) => {
      state.permissions = {...state.permissions, ...action.payload};
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
});

export const {
  setInitialized,
  setOnlineStatus,
  setTheme,
  setUnits,
  updateNotificationSettings,
  updatePermissions,
  setError,
  clearError,
} = appSlice.actions;

export default appSlice.reducer;