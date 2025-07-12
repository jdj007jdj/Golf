/**
 * @file store/slices/gpsSlice.ts
 * @description GPS and location state management
 */

import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {GPSPosition} from '@/types';

interface GPSState {
  currentPosition: GPSPosition | null;
  isTracking: boolean;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  lastUpdate: string | null;
  error: string | null;
}

const initialState: GPSState = {
  currentPosition: null,
  isTracking: false,
  accuracy: 0,
  heading: null,
  speed: null,
  lastUpdate: null,
  error: null,
};

const gpsSlice = createSlice({
  name: 'gps',
  initialState,
  reducers: {
    setCurrentPosition: (state, action: PayloadAction<GPSPosition>) => {
      state.currentPosition = action.payload;
      state.accuracy = action.payload.accuracy || 0;
      state.heading = action.payload.heading || null;
      state.speed = action.payload.speed || null;
      state.lastUpdate = new Date().toISOString();
    },
    setTracking: (state, action: PayloadAction<boolean>) => {
      state.isTracking = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearPosition: state => {
      state.currentPosition = null;
      state.accuracy = 0;
      state.heading = null;
      state.speed = null;
      state.lastUpdate = null;
    },
  },
});

export const {
  setCurrentPosition,
  setTracking,
  setError,
  clearPosition,
} = gpsSlice.actions;

export default gpsSlice.reducer;