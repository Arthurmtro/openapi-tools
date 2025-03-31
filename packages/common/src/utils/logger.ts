/**
 * Simple logger utility with configurable log levels
 */
export const Logger = {
  level: 'info' as LogLevel,

  setLevel(level: LogLevel) {
    this.level = level;
  },

  debug(...args: unknown[]) {
    if (this.level === 'debug') {
      console.debug('[openapi-tools]', ...args);
    }
  },

  info(...args: unknown[]) {
    if (this.level === 'debug' || this.level === 'info') {
      console.info('[openapi-tools]', ...args);
    }
  },

  warn(...args: unknown[]) {
    if (this.level === 'debug' || this.level === 'info' || this.level === 'warn') {
      console.warn('[openapi-tools]', ...args);
    }
  },

  error(...args: unknown[]) {
    if (this.level !== 'silent') {
      console.error('[openapi-tools]', ...args);
    }
  },
};

/**
 * Log levels supported by the logger
 */
export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';
