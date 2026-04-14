/**
 * Conditional logger utility that logs only in development mode,
 * except for errors which are always logged (even in production).
 * 
 * @module utils/logger
 */

const isDev = import.meta.env.DEV;

/**
 * Logger utility with conditional logging based on environment.
 * 
 * @namespace logger
 */
export const logger = {
  /**
   * Logs a message to the console (only in development mode).
   * Use this for general debug information.
   * 
   * @param {...any} args - Arguments to log (same as console.log)
   * @example
   * logger.log('User logged in:', userData);
   */
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Logs an error message to the console (ALWAYS logged, even in production).
   * Use this for errors that need to be tracked in production.
   * 
   * @param {...any} args - Arguments to log (same as console.error)
   * @example
   * logger.error('Failed to submit form:', error);
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Logs a warning message to the console (only in development mode).
   * Use this for warnings that don't break functionality.
   * 
   * @param {...any} args - Arguments to log (same as console.warn)
   * @example
   * logger.warn('Deprecated API endpoint used');
   */
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Logs an informational message to the console (only in development mode).
   * Use this for informational messages about app state.
   * 
   * @param {...any} args - Arguments to log (same as console.info)
   * @example
   * logger.info('Form data saved to localStorage');
   */
  info: (...args) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Logs a debug message to the console (only in development mode).
   * Use this for detailed debugging information.
   * 
   * @param {...any} args - Arguments to log (same as console.debug)
   * @example
   * logger.debug('Component rendered with props:', props);
   */
  debug: (...args) => {
    if (isDev) {
      console.debug(...args);
    }
  },
};
