/**
 * Manages request cancellation tokens
 * Provides a wrapper around AbortController for easier management
 * 
 * Usage example:
 * ```typescript
 * // Create a cancellation token
 * const token = createCancellationToken();
 * 
 * // Use the token in a request
 * client.get('/api/data', { signal: token.signal })
 *   .then(response => console.log(response))
 *   .catch(error => {
 *     if (token.isCancelled) {
 *       console.log('Request was cancelled');
 *     } else {
 *       console.error('Request failed:', error);
 *     }
 *   });
 * 
 * // Cancel the request when needed
 * token.cancel('User navigated away');
 * 
 * // Cancel all in-flight requests
 * cancelAllRequests('Application shutting down');
 * ```
 */
import { Logger } from '../../../utils/logger';

/**
 * CancellationToken class for cancelling in-flight requests
 * Provides a wrapper around AbortController with easier management
 * and tracking of cancellation state
 */
export class CancellationToken {
  private controller: AbortController;
  private cancelled = false;
  private reason?: string;

  /**
   * Creates a new cancellation token
   */
  constructor() {
    this.controller = new AbortController();
  }

  /**
   * Gets the AbortSignal object for this token
   * This signal can be passed to fetch or other APIs that support AbortSignal
   */
  get signal(): AbortSignal {
    return this.controller.signal;
  }

  /**
   * Checks if the token has been cancelled
   */
  get isCancelled(): boolean {
    return this.cancelled;
  }

  /**
   * Gets the reason for cancellation, if available
   */
  get cancellationReason(): string | undefined {
    return this.reason;
  }

  /**
   * Cancels the token with an optional reason
   */
  cancel(reason?: string): void {
    if (this.cancelled) {
      return;
    }

    this.cancelled = true;
    this.reason = reason;
    
    Logger.debug(`Request cancelled: ${reason ?? 'No reason provided'}`);
    this.controller.abort();
  }

  /**
   * Creates a new cancellation token when the existing one is cancelled
   */
  reset(): void {
    if (this.cancelled) {
      this.controller = new AbortController();
      this.cancelled = false;
      this.reason = undefined;
    }
  }
  
  /**
   * Throws if the token is cancelled
   * @throws Error if the token has been cancelled
   */
  throwIfCancelled(): void {
    if (this.cancelled) {
      throw new Error(`Request cancelled: ${this.reason ?? 'No reason provided'}`);
    }
  }
}

/**
 * Creates a cancellation token with easy management
 * @returns A new cancellation token
 */
export function createCancellationToken(): CancellationToken {
  return new CancellationToken();
}

/**
 * Map to track all active cancellation tokens
 * Useful for cancelling all pending requests
 */
const activeCancellationTokens = new Set<CancellationToken>();

/**
 * Creates a tracked cancellation token that is automatically
 * added to the list of active tokens
 * @returns A new tracked cancellation token
 */
export function createTrackedCancellationToken(): CancellationToken {
  const token = new CancellationToken();
  activeCancellationTokens.add(token);
  
  // Remove from active tokens when cancelled
  const originalCancel = token.cancel.bind(token);
  token.cancel = (reason?: string) => {
    originalCancel(reason);
    activeCancellationTokens.delete(token);
  };
  
  return token;
}

/**
 * Cancels all active tokens
 * @param reason Optional reason for cancellation
 */
export function cancelAllRequests(reason = 'User cancelled all requests'): void {
  Logger.info(`Cancelling all requests (${activeCancellationTokens.size} active)`);
  
  for (const token of activeCancellationTokens) {
    token.cancel(reason);
  }
  
  activeCancellationTokens.clear();
}