/**
 * @file types/index.ts
 * @description Mobile-specific type definitions and re-exports from shared types
 */

// Re-export all shared types
export * from '@golf/shared-types';

// Mobile-specific authentication state
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

// Mobile-specific round participant type
export interface RoundParticipant {
  id: string;
  roundId: string;
  userId: string;
  user?: User;
  isScorer: boolean;
  playingHandicap?: number;
  teeBoxId: string;
}

// Extended Shot type for mobile
export interface MobileShot extends Shot {
  roundParticipantId: string;
  startPosition: {
    latitude: number;
    longitude: number;
  };
  endPosition: {
    latitude: number;
    longitude: number;
  };
  shotShape?: 'straight' | 'draw' | 'fade' | 'slice' | 'hook';
  lieType: 'tee' | 'fairway' | 'rough' | 'sand' | 'recovery';
  shotType: 'full' | 'pitch' | 'chip' | 'putt' | 'penalty';
}

// Equipment types
export interface UserClub {
  id: string;
  userId: string;
  clubType: ClubType;
  brand?: string;
  model?: string;
  shaftType?: 'regular' | 'stiff' | 'x-stiff';
  avgDistance?: number;
  createdAt: string;
  updatedAt: string;
}

// Mobile GPS position (extends the shared GeoPoint)
export interface GPSPosition extends GeoPoint {
  heading?: number;
  speed?: number;
  timestamp: number;
}

// Navigation types
export type RootStackParamList = {
  // Auth Stack
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  
  // Main Tab Stack
  MainTabs: undefined;
  Home: undefined;
  
  // Course Stack
  CourseList: undefined;
  CreateCourse: undefined;
  CourseDetail: { courseId: string };
  
  // Round Stack
  StartRound: undefined;
  PlayRound: { roundId: string };
  RoundHistory: undefined;
  RoundSummary: { round: Round };
  
  // Game Stack
  CourseSelection: undefined;
  TeeSelection: { courseId: string };
  GroupSetup: { courseId: string; teeBoxId: string };
  GamePlay: { roundId: string };
  HoleView: { roundId: string; holeNumber: number };
  ShotTracking: { roundId: string; holeId: string };
  
  // Profile Stack
  Profile: undefined;
  Settings: undefined;
  Statistics: undefined;
  
  // Course Stack
  CourseDetails: { courseId: string };
  CourseMap: { courseId: string };
};

export type BottomTabParamList = {
  Play: undefined;
  Rounds: undefined;
  Courses: undefined;
  Social: undefined;
  Profile: undefined;
};

// Mobile-specific form types
export interface FormState<T> {
  values: T;
  errors: ValidationError[];
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}