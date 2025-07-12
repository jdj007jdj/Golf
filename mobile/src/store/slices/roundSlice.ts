/**
 * @file store/slices/roundSlice.ts
 * @description Round management state
 */

import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Round, RoundParticipant, Score} from '@/types';

interface RoundState {
  currentRound: Round | null;
  participants: RoundParticipant[];
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: RoundState = {
  currentRound: null,
  participants: [],
  isActive: false,
  isLoading: false,
  error: null,
};

const roundSlice = createSlice({
  name: 'round',
  initialState,
  reducers: {
    setCurrentRound: (state, action: PayloadAction<Round>) => {
      state.currentRound = action.payload;
      state.isActive = true;
    },
    clearCurrentRound: state => {
      state.currentRound = null;
      state.participants = [];
      state.isActive = false;
    },
    setParticipants: (state, action: PayloadAction<RoundParticipant[]>) => {
      state.participants = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateScore: (state, action: PayloadAction<Score>) => {
      if (state.currentRound && state.currentRound.scores) {
        const existingIndex = state.currentRound.scores.findIndex(
          score => score.holeId === action.payload.holeId
        );
        if (existingIndex >= 0) {
          state.currentRound.scores[existingIndex] = action.payload;
        } else {
          state.currentRound.scores.push(action.payload);
        }
      }
    },
  },
});

export const {
  setCurrentRound,
  clearCurrentRound,
  setParticipants,
  setLoading,
  setError,
  updateScore,
} = roundSlice.actions;

export default roundSlice.reducer;