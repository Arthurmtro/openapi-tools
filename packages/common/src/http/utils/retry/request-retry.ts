/**
 * Request retry utility
 */
import { Logger } from '../../../utils/logger';
import type { RetryOptions } from '../../core/http-types';

/**
 * Default status codes that should trigger a retry
 */
const DEFAULT_RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Default HTTP methods that can be retried
 */
const DEFAULT_RETRY_METHODS = ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'];

/**
 * Request retry handler for improving resilience of API calls
 * Automatically retries failed requests based on configurable conditions
 */
export class RequestRetry {
  private options: Required<RetryOptions> = {
    enabled: false,
    maxRetries: 3,
    retryDelay: 1000,
    statusCodes: DEFAULT_RETRY_STATUS_CODES,
    methods: DEFAULT_RETRY_METHODS as Required<RetryOptions>['methods'],
  };

  constructor(options: Partial<RetryOptions> = {}) {
    this.configure(options);
  }

  /**
   * Updates retry configuration
   */
  configure(options: Partial<RetryOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  /**
   * Checks if a request should be retried based on the error and retry count
   *
   * @param error - The error that occurred
   * @param retryCount - The current retry count
   * @param method - The HTTP method used in the failed request
   * @returns Whether the request should be retried
   */
  shouldRetry(error: unknown, retryCount: number, method?: string): boolean {
    // Don't retry if retries are disabled or we've reached max retries
    if (!this.options.enabled || retryCount >= this.options.maxRetries) {
      return false;
    }

    // Don't retry methods not in the allowed list
    if (method && !this.options.methods.includes(method as any)) {
      Logger.debug(`Not retrying ${method} request (not in allowed methods list)`);
      return false;
    }

    // Check if the error has a status code that should be retried
    const statusCode = this.extractStatusCode(error);
    if (statusCode && this.options.statusCodes.includes(statusCode)) {
      Logger.debug(
        `Retrying request due to status code ${statusCode} (attempt ${retryCount + 1}/${this.options.maxRetries})`,
      );
      return true;
    }

    // Check for network errors (e.g., connection refused, timeout)
    if (this.isNetworkError(error)) {
      Logger.debug(
        `Retrying request due to network error (attempt ${retryCount + 1}/${this.options.maxRetries})`,
      );
      return true;
    }

    return false;
  }

  /**
   * Calculates the delay before the next retry attempt
   *
   * @param retryCount - The current retry count
   * @param error - The error that occurred
   * @returns The delay in milliseconds
   */
  getRetryDelay(retryCount: number, error?: unknown): number {
    if (typeof this.options.retryDelay === 'function') {
      return this.options.retryDelay(retryCount, error);
    }

    // Use exponential backoff with jitter by default
    const baseDelay = typeof this.options.retryDelay === 'number' ? this.options.retryDelay : 1000;

    // Calculate exponential backoff: baseDelay * 2^retryCount
    const delay = baseDelay * Math.pow(2, retryCount);

    // Add jitter to prevent all clients retrying simultaneously
    const jitter = delay * 0.2 * Math.random();

    return delay + jitter;
  }

  /**
   * Extracts the HTTP status code from an error object
   *
   * @param error - The error to examine
   * @returns The status code if found, undefined otherwise
   */
  private extractStatusCode(error: unknown): number | undefined {
    if (!error) return undefined;

    // Handle standard error objects with status or statusCode properties
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;

      // Handle status property
      if (typeof err.status === 'number') {
        return err.status;
      }

      // Handle statusCode property
      if (typeof err.statusCode === 'number') {
        return err.statusCode;
      }

      // Handle response.status path
      if (err.response && typeof err.response === 'object' && err.response !== null) {
        const response = err.response as Record<string, unknown>;
        if (typeof response.status === 'number') {
          return response.status;
        }
      }
    }

    return undefined;
  }

  /**
   * Checks if an error is a network error
   *
   * @param error - The error to examine
   * @returns Whether the error is a network error
   */
  private isNetworkError(error: unknown): boolean {
    if (!error) return false;

    // Check error message for common network error strings
    const errorString = String(error).toLowerCase();
    const networkErrorPatterns = [
      'network error',
      'connection refused',
      'connection reset',
      'timeout',
      'socket hang up',
      'etimedout',
      'econnrefused',
      'econnreset',
      'dns lookup failed',
    ];

    return networkErrorPatterns.some((pattern) => errorString.includes(pattern));
  }
}
