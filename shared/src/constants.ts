/**
 * @file shared/src/constants.ts
 * @description Shared constants for Golf tracking app
 */

// Golf-specific constants
export const GOLF_CONSTANTS = {
  MAX_HOLES_PER_COURSE: 18,
  MIN_HOLES_PER_COURSE: 1,
  MAX_PAR_PER_HOLE: 6,
  MIN_PAR_PER_HOLE: 3,
  MAX_STROKES_PER_HOLE: 20,
  MIN_STROKES_PER_HOLE: 1,
  MAX_PUTTS_PER_HOLE: 10,
  STANDARD_PAR: {
    9: 36,
    18: 72,
  },
} as const;

// Club types and distances (average distances in yards)
export const CLUB_TYPES = {
  DRIVER: 'driver',
  FAIRWAY_WOOD: 'fairway-wood',
  HYBRID: 'hybrid',
  IRON_3: 'iron-3',
  IRON_4: 'iron-4',
  IRON_5: 'iron-5',
  IRON_6: 'iron-6',
  IRON_7: 'iron-7',
  IRON_8: 'iron-8',
  IRON_9: 'iron-9',
  PITCHING_WEDGE: 'pitching-wedge',
  SAND_WEDGE: 'sand-wedge',
  LOB_WEDGE: 'lob-wedge',
  PUTTER: 'putter',
} as const;

export const AVERAGE_CLUB_DISTANCES = {
  [CLUB_TYPES.DRIVER]: { min: 200, max: 300, average: 250 },
  [CLUB_TYPES.FAIRWAY_WOOD]: { min: 170, max: 250, average: 210 },
  [CLUB_TYPES.HYBRID]: { min: 160, max: 220, average: 190 },
  [CLUB_TYPES.IRON_3]: { min: 150, max: 210, average: 180 },
  [CLUB_TYPES.IRON_4]: { min: 140, max: 200, average: 170 },
  [CLUB_TYPES.IRON_5]: { min: 130, max: 185, average: 160 },
  [CLUB_TYPES.IRON_6]: { min: 120, max: 170, average: 150 },
  [CLUB_TYPES.IRON_7]: { min: 110, max: 160, average: 140 },
  [CLUB_TYPES.IRON_8]: { min: 100, max: 145, average: 130 },
  [CLUB_TYPES.IRON_9]: { min: 90, max: 130, average: 115 },
  [CLUB_TYPES.PITCHING_WEDGE]: { min: 80, max: 120, average: 100 },
  [CLUB_TYPES.SAND_WEDGE]: { min: 60, max: 100, average: 80 },
  [CLUB_TYPES.LOB_WEDGE]: { min: 40, max: 80, average: 60 },
  [CLUB_TYPES.PUTTER]: { min: 0, max: 5, average: 2 },
} as const;

// Tee box types
export const TEE_BOXES = {
  BLACK: { name: 'Black', color: '#000000', difficulty: 'championship' },
  BLUE: { name: 'Blue', color: '#0066cc', difficulty: 'men' },
  WHITE: { name: 'White', color: '#ffffff', difficulty: 'regular' },
  GOLD: { name: 'Gold', color: '#ffd700', difficulty: 'senior' },
  RED: { name: 'Red', color: '#cc0000', difficulty: 'women' },
} as const;

// Scoring constants
export const SCORING = {
  EAGLE: -2,
  BIRDIE: -1,
  PAR: 0,
  BOGEY: 1,
  DOUBLE_BOGEY: 2,
  TRIPLE_BOGEY: 3,
} as const;

export const SCORING_NAMES = {
  [-4]: 'Condor',
  [-3]: 'Albatross',
  [-2]: 'Eagle',
  [-1]: 'Birdie',
  [0]: 'Par',
  [1]: 'Bogey',
  [2]: 'Double Bogey',
  [3]: 'Triple Bogey',
  [4]: 'Quadruple Bogey',
} as const;

// GPS and location constants
export const GPS_CONSTANTS = {
  HIGH_ACCURACY_THRESHOLD: 5, // meters
  MEDIUM_ACCURACY_THRESHOLD: 10, // meters
  LOW_ACCURACY_THRESHOLD: 20, // meters
  LOCATION_UPDATE_INTERVAL: 5000, // milliseconds
  DISTANCE_FILTER: 2, // meters
} as const;

// Sync constants
export const SYNC_CONSTANTS = {
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000, // milliseconds
  SYNC_INTERVAL: 30000, // milliseconds
  OFFLINE_QUEUE_LIMIT: 1000,
} as const;

// API constants
export const API_CONSTANTS = {
  REQUEST_TIMEOUT: 30000, // milliseconds
  MAX_CONCURRENT_REQUESTS: 5,
  RATE_LIMIT_WINDOW: 60000, // milliseconds
  RATE_LIMIT_MAX_REQUESTS: 100,
} as const;

// Validation constants
export const VALIDATION_CONSTANTS = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MAX_LENGTH: 50,
  COURSE_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  NOTES_MAX_LENGTH: 1000,
} as const;

// Achievement point values
export const ACHIEVEMENT_POINTS = {
  FIRST_ROUND: 10,
  HOLE_IN_ONE: 100,
  EAGLE: 50,
  BIRDIE: 20,
  UNDER_PAR_ROUND: 30,
  COURSE_RECORD: 200,
  LONG_DRIVE: 25,
  ACCURATE_APPROACH: 15,
  CONSISTENT_PUTTING: 20,
} as const;

// Weather condition mappings
export const WEATHER_CONDITIONS = {
  SUNNY: { icon: '☀️', description: 'Sunny' },
  CLOUDY: { icon: '☁️', description: 'Cloudy' },
  RAINY: { icon: '🌧️', description: 'Rainy' },
  WINDY: { icon: '💨', description: 'Windy' },
  FOGGY: { icon: '🌫️', description: 'Foggy' },
} as const;

// Hazard types
export const HAZARD_TYPES = {
  WATER: { name: 'Water', penalty: 1, color: '#0066cc' },
  SAND: { name: 'Sand', penalty: 0, color: '#daa520' },
  TREES: { name: 'Trees', penalty: 0, color: '#228b22' },
  OUT_OF_BOUNDS: { name: 'Out of Bounds', penalty: 1, color: '#cc0000' },
} as const;

// Unit conversion constants
export const CONVERSION = {
  YARDS_TO_METERS: 0.9144,
  METERS_TO_YARDS: 1.09361,
  FEET_TO_METERS: 0.3048,
  METERS_TO_FEET: 3.28084,
  CELSIUS_TO_FAHRENHEIT: (c: number) => (c * 9/5) + 32,
  FAHRENHEIT_TO_CELSIUS: (f: number) => (f - 32) * 5/9,
  KMH_TO_MPH: 0.621371,
  MPH_TO_KMH: 1.60934,
} as const;

// Default values
export const DEFAULTS = {
  COURSE: {
    HOLES: 18,
    PAR: 72,
    RATING: 72.0,
    SLOPE: 113,
  },
  HOLE: {
    PAR: 4,
    YARDAGE: 400,
  },
  USER: {
    HANDICAP: 20,
    UNITS: 'imperial' as const,
    GPS_ACCURACY: 'high' as const,
  },
  ROUND: {
    TEES: 'White',
  },
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Database errors
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD: 'DUPLICATE_RECORD',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // Golf-specific errors
  INVALID_SCORE: 'INVALID_SCORE',
  ROUND_ALREADY_COMPLETED: 'ROUND_ALREADY_COMPLETED',
  HOLE_NOT_FOUND: 'HOLE_NOT_FOUND',
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
} as const;

// Export types for the constants
export type ClubType = typeof CLUB_TYPES[keyof typeof CLUB_TYPES];
export type TeeBoxType = keyof typeof TEE_BOXES;
export type WeatherCondition = keyof typeof WEATHER_CONDITIONS;
export type HazardType = keyof typeof HAZARD_TYPES;
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];