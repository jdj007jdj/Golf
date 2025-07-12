/**
 * @file store/index.ts
 * @description Redux store configuration
 */

import {configureStore} from '@reduxjs/toolkit';
import {useDispatch, useSelector, TypedUseSelectorHook} from 'react-redux';
import {persistStore, persistReducer, createMigrate} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {combineReducers} from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import roundReducer from './slices/roundSlice';
import courseReducer from './slices/courseSlice';
import gpsReducer from './slices/gpsSlice';
import syncReducer from './slices/syncSlice';
import appReducer from './slices/appSlice';

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  round: roundReducer,
  course: courseReducer,
  gps: gpsReducer,
  sync: syncReducer,
  app: appReducer,
});

// Migrations for different versions
const migrations = {
  0: (state: any) => {
    // Migration to version 0 (initial)
    return state;
  },
  1: (state: any) => {
    // Migration to version 1 - add new fields if needed
    return {
      ...state,
      app: {
        ...state.app,
        lastMigration: Date.now(),
      },
    };
  },
};

// Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'course', 'round', 'app'], // Only persist these slices
  blacklist: ['gps', 'sync'], // Don't persist GPS and sync state
  migrate: createMigrate(migrations, {debug: __DEV__}),
  timeout: 10000, // 10 second timeout
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Configure Redux store
 */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
          'persist/FLUSH',
          'persist/PAUSE',
          'persist/PURGE',
        ],
        ignoredPaths: ['_persist'],
      },
      immutableCheck: {
        ignoredPaths: ['_persist'],
      },
    }),
  devTools: __DEV__,
});

// Create persistor
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;