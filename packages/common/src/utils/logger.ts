/**
 * Log levels supported by the logger
 */
export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  level?: LogLevel;
  prefix?: string;
  colorize?: boolean;
  timestamp?: boolean;
}

/**
 * Error types for categorization
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  AUTH = 'AUTHENTICATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

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
 * Enhanced logger with pretty formatting and better error classification
 * 
 * This logger adds additional features compared to the basic Logger:
 * - Color-coded output for different log levels
 * - Timestamp support
 * - Error type classification and formatting
 * - Structured error output
 * - Configurable prefix and formatting options
 */
export class EnhancedLogger {
  private level: LogLevel = 'info';
  private prefix: string = '[openapi-tools]';
  private colorize: boolean = true;
  private timestamp: boolean = true;

  // ANSI color codes
  private colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
  };

  constructor(config: LoggerConfig = {}) {
    if (config.level) this.level = config.level;
    if (config.prefix) this.prefix = config.prefix;
    if (config.colorize !== undefined) this.colorize = config.colorize;
    if (config.timestamp !== undefined) this.timestamp = config.timestamp;
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Set the logger configuration options
   */
  configure(config: LoggerConfig): void {
    if (config.level) this.level = config.level;
    if (config.prefix) this.prefix = config.prefix;
    if (config.colorize !== undefined) this.colorize = config.colorize;
    if (config.timestamp !== undefined) this.timestamp = config.timestamp;
  }

  /**
   * Get formatted prefix with optional timestamp
   */
  private getPrefix(levelColor: string = ''): string {
    let prefix = this.prefix;
    
    if (this.timestamp) {
      const now = new Date();
      const timestamp = now.toISOString().split('T')[1].slice(0, -1);
      prefix = `${this.colorize ? this.colors.dim : ''}[${timestamp}]${this.colorize ? this.colors.reset : ''} ${prefix}`;
    }
    
    return `${this.colorize ? levelColor : ''}${prefix}${this.colorize ? this.colors.reset : ''}`;
  }

  /**
   * Format an error for better readability
   */
  private formatError(error: unknown): string {
    if (!error) return 'Unknown error (null or undefined)';
    
    if (error instanceof Error) {
      const enhancedError = error as Error & { 
        status?: number; 
        code?: string; 
        details?: unknown;
        type?: ErrorType;
      };
      
      // Determine error type if not set
      if (!enhancedError.type) {
        enhancedError.type = this.determineErrorType(enhancedError);
      }
      
      let formattedError = this.colorize 
        ? `${this.colors.bright}${this.colors.red}[${enhancedError.type}]${this.colors.reset} ${enhancedError.message}`
        : `[${enhancedError.type}] ${enhancedError.message}`;
      
      // Add status code if available
      if (enhancedError.status) {
        formattedError += this.colorize 
          ? ` (Status: ${this.colors.yellow}${enhancedError.status}${this.colors.reset})`
          : ` (Status: ${enhancedError.status})`;
      }
      
      // Add error code if available
      if (enhancedError.code) {
        formattedError += this.colorize 
          ? ` (Code: ${this.colors.cyan}${enhancedError.code}${this.colors.reset})`
          : ` (Code: ${enhancedError.code})`;
      }
      
      // Add details if available and in debug mode
      if (this.level === 'debug' && enhancedError.details) {
        formattedError += '\nDetails: ' + JSON.stringify(enhancedError.details, null, 2);
      }
      
      // Add stack trace in debug mode
      if (this.level === 'debug' && enhancedError.stack) {
        formattedError += '\n' + enhancedError.stack.split('\n').slice(1).join('\n');
      }
      
      return formattedError;
    }
    
    if (typeof error === 'object') {
      return JSON.stringify(error, null, 2);
    }
    
    return String(error);
  }

  /**
   * Determine the error type based on its properties
   */
  private determineErrorType(error: Error & { status?: number; code?: string }): ErrorType {
    if (error.message.toLowerCase().includes('network') || 
        error.message.toLowerCase().includes('connect') ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND') {
      return ErrorType.NETWORK;
    }
    
    if (error.message.toLowerCase().includes('timeout') || 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ESOCKETTIMEDOUT') {
      return ErrorType.TIMEOUT;
    }
    
    if (error.status === 401 || error.status === 403 || 
        error.message.toLowerCase().includes('unauthorized') ||
        error.message.toLowerCase().includes('forbidden')) {
      return ErrorType.AUTH;
    }
    
    if (error.status && error.status >= 500) {
      return ErrorType.SERVER;
    }
    
    if (error.status && error.status >= 400 && error.status < 500) {
      return ErrorType.CLIENT;
    }
    
    if (error.message.toLowerCase().includes('valid')) {
      return ErrorType.VALIDATION;
    }
    
    return ErrorType.UNKNOWN;
  }

  /**
   * Log a debug message
   */
  debug(...args: unknown[]): void {
    if (this.level === 'debug') {
      console.debug(this.getPrefix(this.colors.blue), ...args);
    }
  }

  /**
   * Log an info message
   */
  info(...args: unknown[]): void {
    if (this.level === 'debug' || this.level === 'info') {
      console.info(this.getPrefix(this.colors.green), ...args);
    }
  }

  /**
   * Log a warning message
   */
  warn(...args: unknown[]): void {
    if (this.level === 'debug' || this.level === 'info' || this.level === 'warn') {
      console.warn(this.getPrefix(this.colors.yellow), ...args);
    }
  }

  /**
   * Log an error message with enhanced formatting
   */
  error(...args: unknown[]): void {
    if (this.level !== 'silent') {
      const formattedArgs = args.map(arg => 
        arg instanceof Error || (arg && typeof arg === 'object' && 'message' in arg) 
          ? this.formatError(arg) 
          : arg
      );
      console.error(this.getPrefix(this.colors.red), ...formattedArgs);
    }
  }
  
  /**
   * Create an error interceptor that logs and classifies errors
   * 
   * @returns An error interceptor function for use with ApiClient
   */
  createErrorInterceptor() {
    return (error: unknown): Promise<unknown> => {
      this.error('API request failed:', error);
      return Promise.reject(error);
    };
  }
}

// Export a default instance of the enhanced logger
export const enhancedLogger = new EnhancedLogger();
