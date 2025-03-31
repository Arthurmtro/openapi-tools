/**
 * Debounce utility for HTTP requests
 * 
 * Allows grouping rapidly fired requests to the same endpoint 
 * into a single request after a delay period has passed.
 * 
 * Usage example:
 * ```typescript
 * // Create a debounced function that calls the API
 * const debouncedSearch = debounceRequest(
 *   (query: string) => client.get(`/api/search?q=${query}`),
 *   300 // 300ms delay
 * );
 * 
 * // Call it multiple times rapidly, only the last one executes
 * debouncedSearch('a');
 * debouncedSearch('ap');
 * debouncedSearch('app');
 * debouncedSearch('appl');
 * debouncedSearch('apple'); // Only this request is actually made
 * ```
 */

import { Logger } from '../../../utils/logger';
import { createCancellationToken, CancellationToken } from '../cancellation';

/**
 * Options for request debouncing
 */
export interface DebounceOptions {
  /**
   * Whether debouncing is enabled
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Debounce delay in milliseconds
   * @default 300
   */
  delay?: number;
  
  /**
   * Whether to cancel pending requests when a new one is made
   * @default true
   */
  cancelPending?: boolean;

  /**
   * Maximum wait time in milliseconds
   * If provided, the function will be called after this time even if
   * new requests keep coming in
   * @default undefined (no max wait)
   */
  maxWait?: number;
}

/**
 * Manages debounced requests by endpoint key
 */
export class DebounceManager {
  private timers = new Map<string, {
    timerId: NodeJS.Timeout;
    token: CancellationToken;
    timestamp: number;
    maxWaitTimerId?: NodeJS.Timeout;
  }>();
  
  private options: Required<Omit<DebounceOptions, 'maxWait'>> & Pick<DebounceOptions, 'maxWait'> = {
    enabled: true,
    delay: 300,
    cancelPending: true
  };
  
  constructor(options: DebounceOptions = {}) {
    this.configure(options);
  }
  
  /**
   * Updates the debounce configuration
   */
  configure(options: DebounceOptions): void {
    this.options = {
      ...this.options,
      ...options
    };
  }
  
  /**
   * Debounces a request based on a key
   * @param key - Unique key to identify similar requests (e.g., endpoint URL)
   * @param requestFn - The function that performs the actual request
   * @returns A promise that resolves with the request result
   */
  debounce<T>(key: string, requestFn: (signal?: AbortSignal) => Promise<T>): Promise<T> {
    // If debouncing is disabled, execute the request immediately
    if (!this.options.enabled) {
      return requestFn();
    }
    
    return new Promise<T>((resolve, reject) => {
      // Cancel previous request if requested
      const existing = this.timers.get(key);
      if (existing) {
        clearTimeout(existing.timerId);
        
        // If maxWait timer exists, clear it only if we're starting a new timer
        if (existing.maxWaitTimerId) {
          clearTimeout(existing.maxWaitTimerId);
        }
        
        // Cancel previous request if option is enabled
        if (this.options.cancelPending) {
          existing.token.cancel(`Debounced: newer request to ${key} was made`);
        }
      }
      
      // Create a new cancellation token
      const token = createCancellationToken();
      
      // Create timeout to execute the request after delay
      const timerId = setTimeout(async () => {
        this.timers.delete(key);
        
        try {
          // Execute the request with the cancellation token
          const result = await requestFn(token.signal);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, this.options.delay);
      
      // Store the timer details
      const currentTimestamp = Date.now();
      const newTimer = {
        timerId,
        token,
        timestamp: currentTimestamp
      };
      
      // If maxWait is provided, set a maximum wait timer
      if (this.options.maxWait) {
        // If we already have a timestamp from a previous call, use that
        // to calculate the remaining wait time
        const startTimestamp = existing?.timestamp || currentTimestamp;
        const timeElapsed = currentTimestamp - startTimestamp;
        const remainingMaxWait = Math.max(0, this.options.maxWait - timeElapsed);
        
        if (remainingMaxWait < this.options.delay) {
          // If max wait will trigger before the normal delay, set a timer for it
          newTimer.maxWaitTimerId = setTimeout(async () => {
            if (this.timers.has(key)) {
              this.timers.delete(key);
              clearTimeout(timerId);
              
              try {
                Logger.debug(`Max wait time reached, executing debounced request to ${key}`);
                const result = await requestFn(token.signal);
                resolve(result);
              } catch (error) {
                reject(error);
              }
            }
          }, remainingMaxWait);
        }
      }
      
      this.timers.set(key, newTimer);
    });
  }
  
  /**
   * Cancels all pending debounced requests
   */
  cancelAll(): void {
    for (const [key, { timerId, token, maxWaitTimerId }] of this.timers.entries()) {
      clearTimeout(timerId);
      if (maxWaitTimerId) {
        clearTimeout(maxWaitTimerId);
      }
      token.cancel(`Debounced request to ${key} cancelled`);
    }
    
    this.timers.clear();
  }
  
  /**
   * Cancels a specific debounced request by key
   */
  cancel(key: string): boolean {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer.timerId);
      if (timer.maxWaitTimerId) {
        clearTimeout(timer.maxWaitTimerId);
      }
      timer.token.cancel(`Debounced request to ${key} cancelled`);
      this.timers.delete(key);
      return true;
    }
    return false;
  }
  
  /**
   * Immediately executes a debounced request without waiting for delay
   */
  flush<T>(key: string, requestFn: (signal?: AbortSignal) => Promise<T>): Promise<T> | undefined {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer.timerId);
      if (timer.maxWaitTimerId) {
        clearTimeout(timer.maxWaitTimerId);
      }
      this.timers.delete(key);
      
      return requestFn(timer.token.signal);
    }
    return undefined;
  }
}

/**
 * Creates a debounce manager with the specified options
 */
export function createDebounceManager(options: DebounceOptions = {}): DebounceManager {
  return new DebounceManager(options);
}

// Singleton instance for global use
const defaultDebounceManager = new DebounceManager();

/**
 * Creates a debounced version of an API request function
 * 
 * @param requestFn - The function to debounce
 * @param delay - Debounce delay in milliseconds (default: 300)
 * @param options - Additional debounce options
 * @returns A debounced version of the function
 */
export function debounceRequest<T extends (...args: any[]) => Promise<any>>(
  requestFn: T,
  delay: number = 300,
  options: Omit<DebounceOptions, 'delay'> = {}
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  // Function to generate a unique key based on function and arguments
  const keyGenerator = (...args: Parameters<T>): string => {
    const fnName = requestFn.name || 'anonymous';
    return `${fnName}:${JSON.stringify(args)}`;
  };
  
  // Configure the debounce manager with options
  const manager = defaultDebounceManager;
  manager.configure({
    ...options,
    delay,
    enabled: true
  });
  
  // Return the debounced function
  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = keyGenerator(...args);
    return manager.debounce(key, () => requestFn(...args)) as Promise<ReturnType<T>>;
  };
}

/**
 * Cancels all pending debounced requests
 */
export function cancelAllDebouncedRequests(): void {
  defaultDebounceManager.cancelAll();
}