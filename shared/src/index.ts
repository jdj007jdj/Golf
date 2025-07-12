/**
 * @file shared/src/index.ts
 * @description Shared TypeScript types for Golf tracking app
 */

// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User related types
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  handicap?: number;
  avatarUrl?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  units: 'imperial' | 'metric';
  defaultTees: string;
  gpsAccuracy: 'high' | 'medium' | 'low';
  notifications: {
    scoreReminders: boolean;
    syncUpdates: boolean;
    socialActivity: boolean;
  };
}

// Authentication types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Course related types
export interface Course extends BaseEntity {
  name: string;
  location?: string;
  description?: string;
  website?: string;
  phone?: string;
  rating?: number;
  slope?: number;
  latitude?: number;
  longitude?: number;
  createdBy?: string;
  holes?: Hole[];
  _count?: {
    rounds: number;
  };
}

export interface Hole extends BaseEntity {
  courseId: string;
  number: number;
  par: number;
  name?: string;
  description?: string;
  yardage?: number;
  meters?: number;
  handicap?: number;
  latitude?: number;
  longitude?: number;
  teeBoxes?: TeeBox[];
  hazards?: Hazard[];
}

export interface TeeBox {
  id: string;
  holeId: string;
  name: string; // 'Black', 'Blue', 'White', 'Red', etc.
  color: string;
  yardage: number;
  meters: number;
  latitude?: number;
  longitude?: number;
}

export interface Hazard {
  id: string;
  holeId: string;
  type: 'water' | 'sand' | 'trees' | 'out-of-bounds';
  name?: string;
  coordinates: GeoPoint[];
}

// Round related types
export interface Round extends BaseEntity {
  courseId: string;
  playerId: string;
  status: RoundStatus;
  tees?: string;
  startedAt: string;
  completedAt?: string;
  weather?: WeatherConditions;
  notes?: string;
  course?: Course;
  scores?: Score[];
  statistics?: RoundStatistics;
}

export type RoundStatus = 'active' | 'completed' | 'abandoned';

export interface WeatherConditions {
  temperature: number; // Celsius
  humidity: number; // Percentage
  windSpeed: number; // km/h
  windDirection: number; // Degrees
  conditions: 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'foggy';
}

// Score related types
export interface Score extends BaseEntity {
  roundId: string;
  holeId: string;
  strokes: number;
  putts?: number;
  penalties?: number;
  notes?: string;
  shots?: Shot[];
  hole?: {
    id: string;
    number: number;
    par: number;
    name?: string;
  };
}

export interface Shot extends BaseEntity {
  scoreId: string;
  shotNumber: number;
  club?: ClubType;
  distance?: number; // yards
  accuracy?: 'fairway' | 'rough' | 'sand' | 'water' | 'trees';
  location: GeoPoint;
  notes?: string;
}

export type ClubType = 
  | 'driver' 
  | 'fairway-wood' 
  | 'hybrid' 
  | 'iron-3' 
  | 'iron-4' 
  | 'iron-5' 
  | 'iron-6' 
  | 'iron-7' 
  | 'iron-8' 
  | 'iron-9' 
  | 'pitching-wedge' 
  | 'sand-wedge' 
  | 'lob-wedge' 
  | 'putter';

// GPS and location types
export interface GeoPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp?: string;
}

export interface GPSLocation extends GeoPoint {
  speed?: number;
  heading?: number;
}

// Statistics types
export interface RoundStatistics {
  totalScore: number;
  totalPutts: number;
  fairwaysHit: number;
  greensInRegulation: number;
  totalDistance: number;
  averageDriveDistance: number;
  longestDrive: number;
  strokesGained?: StrokesGained;
}

export interface StrokesGained {
  total: number;
  offTheTee: number;
  approachTheGreen: number;
  aroundTheGreen: number;
  putting: number;
}

// Club tracking types
export interface ClubPerformance {
  club: ClubType;
  averageDistance: number;
  accuracy: number;
  usageCount: number;
  lastUsed: string;
}

// Sync and offline types
export interface SyncQueueItem {
  id: string;
  tableName: string;
  operation: 'insert' | 'update' | 'delete';
  recordId: string;
  data: any;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface OfflineQueue {
  pending: SyncQueueItem[];
  failed: SyncQueueItem[];
  syncing: boolean;
  lastSync?: string;
}

export interface SyncStatus {
  lastSync: string | null;
  pendingChanges: number;
  isSyncing: boolean;
  isOnline: boolean;
  conflicts: ConflictItem[];
}

export interface ConflictItem {
  id: string;
  tableName: string;
  recordId: string;
  localData: any;
  remoteData: any;
  timestamp: string;
  resolved: boolean;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// WebSocket event types
export interface WebSocketEvent<T = any> {
  type: string;
  data: T;
  timestamp: string;
  userId?: string;
  roundId?: string;
}

// Real-time update types
export interface RealTimeUpdate {
  type: 'score' | 'round' | 'course' | 'user';
  action: 'create' | 'update' | 'delete';
  data: any;
  userId: string;
  timestamp: string;
}

// Social features types
export interface Friend extends BaseEntity {
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  friend?: User;
}

export interface Group extends BaseEntity {
  name: string;
  description?: string;
  createdBy: string;
  isPrivate: boolean;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user?: User;
}

// Tournament and competition types
export interface Tournament extends BaseEntity {
  name: string;
  description?: string;
  courseId: string;
  startDate: string;
  endDate: string;
  format: TournamentFormat;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  maxParticipants?: number;
  entryFee?: number;
  prizes?: TournamentPrize[];
  leaderboard?: LeaderboardEntry[];
}

export type TournamentFormat = 'stroke-play' | 'match-play' | 'scramble' | 'best-ball';

export interface TournamentPrize {
  position: number;
  description: string;
  value?: number;
}

export interface LeaderboardEntry {
  userId: string;
  position: number;
  totalScore: number;
  rounds: number;
  user?: User;
}

// Notification types
export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  readAt?: string;
}

export type NotificationType = 
  | 'friend-request'
  | 'round-invitation'
  | 'score-update'
  | 'tournament-invite'
  | 'achievement'
  | 'system';

// Achievement types
export interface Achievement extends BaseEntity {
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirements: AchievementRequirement[];
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export type AchievementCategory = 
  | 'scoring'
  | 'distance'
  | 'accuracy'
  | 'improvement'
  | 'social'
  | 'course';

export interface AchievementRequirement {
  type: string;
  value: number;
  condition: string;
}

export interface UserAchievement extends BaseEntity {
  userId: string;
  achievementId: string;
  progress: number;
  completed: boolean;
  completedAt?: string;
  achievement?: Achievement;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

// Filter and query types
export interface CourseFilter {
  name?: string;
  location?: string;
  rating?: { min?: number; max?: number };
  distance?: { lat: number; lng: number; radius: number };
}

export interface RoundFilter {
  playerId?: string;
  courseId?: string;
  status?: RoundStatus;
  dateRange?: { start: string; end: string };
}

export interface ScoreFilter {
  roundId?: string;
  holeNumber?: number;
  minStrokes?: number;
  maxStrokes?: number;
}

// Export all types
export * from './validation';
export * from './constants';