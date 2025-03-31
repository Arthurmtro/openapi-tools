import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger } from '../src/utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should respect log level when logging', () => {
    // Mock console methods
    const originalConsole = { ...console };
    const mockConsole = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    // Override console methods
    console.debug = mockConsole.debug;
    console.info = mockConsole.info;
    console.warn = mockConsole.warn;
    console.error = mockConsole.error;

    try {
      // Set to error level
      Logger.setLevel('error');

      // Test logging at different levels
      Logger.debug('debug message');
      Logger.info('info message');
      Logger.warn('warn message');
      Logger.error('error message');

      // Only error should be logged
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalledWith('[openapi-tools]', 'error message');

      // Reset mocks
      vi.clearAllMocks();

      // Set to warn level
      Logger.setLevel('warn');

      // Test logging again
      Logger.debug('debug message');
      Logger.info('info message');
      Logger.warn('warn message');
      Logger.error('error message');

      // Warn and error should be logged
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledWith('[openapi-tools]', 'warn message');
      expect(mockConsole.error).toHaveBeenCalledWith('[openapi-tools]', 'error message');

      // Reset mocks
      vi.clearAllMocks();

      // Set to info level
      Logger.setLevel('info');

      // Test logging again
      Logger.debug('debug message');
      Logger.info('info message');
      Logger.warn('warn message');
      Logger.error('error message');

      // Info, warn, and error should be logged
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).toHaveBeenCalledWith('[openapi-tools]', 'info message');
      expect(mockConsole.warn).toHaveBeenCalledWith('[openapi-tools]', 'warn message');
      expect(mockConsole.error).toHaveBeenCalledWith('[openapi-tools]', 'error message');

      // Reset mocks
      vi.clearAllMocks();

      // Set to debug level
      Logger.setLevel('debug');

      // Test logging again
      Logger.debug('debug message');
      Logger.info('info message');
      Logger.warn('warn message');
      Logger.error('error message');

      // All levels should be logged
      expect(mockConsole.debug).toHaveBeenCalledWith('[openapi-tools]', 'debug message');
      expect(mockConsole.info).toHaveBeenCalledWith('[openapi-tools]', 'info message');
      expect(mockConsole.warn).toHaveBeenCalledWith('[openapi-tools]', 'warn message');
      expect(mockConsole.error).toHaveBeenCalledWith('[openapi-tools]', 'error message');

      // Reset mocks
      vi.clearAllMocks();

      // Set to silent level
      Logger.setLevel('silent');

      // Test logging again
      Logger.debug('debug message');
      Logger.info('info message');
      Logger.warn('warn message');
      Logger.error('error message');

      // Nothing should be logged
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
    } finally {
      // Restore original console methods
      console.debug = originalConsole.debug;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    }
  });
});
