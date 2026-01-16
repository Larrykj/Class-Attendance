// Simple logger utility for application-wide logging
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Set minimum log level based on environment
const CURRENT_LOG_LEVEL = import.meta.env.DEV
  ? LOG_LEVELS.DEBUG
  : LOG_LEVELS.INFO;

// Helper to format log data
const formatLogData = (data) => {
  if (!data) return '';
  
  try {
    if (typeof data === 'string') return data;
    return JSON.stringify(data);
  } catch (e) {
    return '[Unserializable data]';
  }
};

// Helper to get timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Create a logger object with methods for each log level
export const logger = {
  debug: (message, data) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      console.debug(
        `[${getTimestamp()}] [DEBUG] ${message}`,
        data ? formatLogData(data) : ''
      );
    }
  },
  
  info: (message, data) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
      console.info(
        `[${getTimestamp()}] [INFO] ${message}`,
        data ? formatLogData(data) : ''
      );
    }
  },
  
  warn: (message, data) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(
        `[${getTimestamp()}] [WARN] ${message}`,
        data ? formatLogData(data) : ''
      );
    }
  },
  
  error: (message, data) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(
        `[${getTimestamp()}] [ERROR] ${message}`,
        data ? formatLogData(data) : ''
      );
    }
  },
  
  // Helper to log performance metrics
  perf: (label, startTime) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      const duration = performance.now() - startTime;
      console.debug(
        `[${getTimestamp()}] [PERF] ${label}: ${duration.toFixed(2)}ms`
      );
    }
  }
};

export default logger;