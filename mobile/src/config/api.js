// API Configuration

// IMPORTANT: Update this IP address based on your setup:
// - For Android Emulator: use '10.0.2.2'
// - For Physical Device: use your computer's IP address (run 'ipconfig' on Windows)
// - Common local IPs: 192.168.1.x or 192.168.0.x
const API_HOST = '192.168.0.123'; // Your Windows IP - now working with port proxy!

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
    ROUNDS: '/api/rounds'
  }
};