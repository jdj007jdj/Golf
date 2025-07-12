/**
 * @file store/slices/courseSlice.ts
 * @description Course management state
 */

import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Course, TeeBox, Hole} from '@/types';

interface CourseState {
  courses: Course[];
  selectedCourse: Course | null;
  teeBoxes: TeeBox[];
  holes: Hole[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  courses: [],
  selectedCourse: null,
  teeBoxes: [],
  holes: [],
  isLoading: false,
  error: null,
};

const courseSlice = createSlice({
  name: 'course',
  initialState,
  reducers: {
    setCourses: (state, action: PayloadAction<Course[]>) => {
      state.courses = action.payload;
    },
    setSelectedCourse: (state, action: PayloadAction<Course | null>) => {
      state.selectedCourse = action.payload;
    },
    setTeeBoxes: (state, action: PayloadAction<TeeBox[]>) => {
      state.teeBoxes = action.payload;
    },
    setHoles: (state, action: PayloadAction<Hole[]>) => {
      state.holes = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setCourses,
  setSelectedCourse,
  setTeeBoxes,
  setHoles,
  setLoading,
  setError,
} = courseSlice.actions;

export default courseSlice.reducer;