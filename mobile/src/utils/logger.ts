/**
 * @file utils/logger.ts
 * @description Logging utility for React Native
 */

interface LogLevel {
  DEBUG: number;
  INFO: number;
  WARN: number;
  ERROR: number;
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  private currentLevel: number;

  constructor() {
    // Set log level based on environment
    this.currentLevel = __DEV__ ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
  }

  private log(level: number, levelName: string, message: string, ...args: any[]) {
    if (level >= this.currentLevel) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${levelName}] ${message}`;
      
      if (level >= LOG_LEVELS.ERROR) {
        console.error(logMessage, ...args);
      } else if (level >= LOG_LEVELS.WARN) {
        console.warn(logMessage, ...args);
      } else {
        console.log(logMessage, ...args);
      }
    }
  }

  debug(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.DEBUG, 'DEBUG', message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.INFO, 'INFO', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.WARN, 'WARN', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log(LOG_LEVELS.ERROR, 'ERROR', message, ...args);
  }

  setLevel(level: keyof LogLevel) {
    this.currentLevel = LOG_LEVELS[level];
  }
}

export const logger = new Logger();