// API Configuration

// IMPORTANT: Update this IP address based on your setup:
// - For Android Emulator: use '10.0.2.2'
// - For Physical Device: use your computer's IP address (run 'ipconfig' on Windows)
// - Common local IPs: 192.168.1.x or 192.168.0.x
const API_HOST = '192.168.0.116'; // Your Windows IP - updated 2025-01-20

export const API_CONFIG = {
  BASE_URL: `http://${API_HOST}:3000`,
  TIMEOUT: 10000,
  ENDPOINTS: {
    HEALTH: '/health',
    AUTH: {
      REGISTER: '/api/auth/register',
      LOGIN: '/api/auth/login',
      REFRESH: '/api/auth/refresh',
      ME: '/api/auth/me',
      LOGOUT: '/api/auth/logout'
    },
    COURSES: '/api/courses',
    ROUNDS: '/api/rounds',
    USERS: {
      PROFILE: '/api/users/profile',
      STATS: '/api/users/stats'
    },
    SHOTS: {
      SYNC: '/api/sync/shots',
      ROUND: '/api/shots/round',
      HISTORY: '/api/shots/history'
    },
    COURSE_LEARNING: {
      CONTRIBUTE: '/api/course-learning/contribute',
      DATA: '/api/course-learning/data',
      SYNC: '/api/sync/course-learning'
    },
    GAMES: {
      CREATE: '/api/games',
      GET: '/api/games',
      UPDATE_SCORE: '/api/games',
      COMPLETE: '/api/games',
      HISTORY: '/api/games/history',
      BY_ROUND: '/api/games/round'
    }
  }
};