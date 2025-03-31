/**
 * Request throttling utility
 */
import { Logger } from '../../../utils/logger';
import type { ThrottleOptions } from '../../core/http-types';

/**
 * Request throttler for rate-limiting API calls
 * Prevents API rate limit errors by controlling request frequency
 */
export class RequestThrottler {
  private requestTimestamps: number[] = [];
  private queue: Array<{
    request: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];
  private timer: NodeJS.Timeout | null = null;
  
  private options: Required<ThrottleOptions> = {
    enabled: false,
    limit: 60,
    interval: 60000, // 1 minute
    strategy: 'queue',
    maxQueueSize: 100
  };
  
  constructor(options: Partial<ThrottleOptions> = {}) {
    this.configure(options);
  }
  
  /**
   * Updates throttler configuration
   */
  configure(options: Partial<ThrottleOptions>): void {
    this.options = {
      ...this.options,
      ...options
    };
    
    // If throttling was disabled, process the queue
    if (options.enabled === false && this.queue.length > 0) {
      this.processQueue();
    }
  }
  
  /**
   * Throttles a request function based on configured rate limits
   */
  throttle<T>(requestFn: () => Promise<T>): Promise<T> {
    // If throttling is disabled, execute the request immediately
    if (!this.options.enabled) {
      return requestFn();
    }
    
    // Clean up old timestamps
    this.cleanTimestamps();
    
    // Check if we're at the rate limit
    if (this.requestTimestamps.length < this.options.limit) {
      // We're under the limit, execute the request immediately
      this.requestTimestamps.push(Date.now());
      return requestFn();
    }
    
    // We're at the limit, handle according to strategy
    if (this.options.strategy === 'error') {
      Logger.warn(`Rate limit exceeded: ${this.options.limit} requests per ${this.options.interval}ms. Request rejected.`);
      return Promise.reject(
        new Error(`Rate limit exceeded: ${this.options.limit} requests per ${this.options.interval}ms`)
      );
    }
    
    // Queue strategy
    return new Promise<T>((resolve, reject) => {
      // Check if queue is full
      if (this.queue.length >= this.options.maxQueueSize) {
        Logger.warn(`Request queue full (${this.options.maxQueueSize} items), rejecting request`);
        reject(new Error(`Request queue full (${this.options.maxQueueSize} items), rejecting request`));
        return;
      }
      
      // Add to queue
      Logger.debug(`Rate limit reached. Queueing request. Queue size: ${this.queue.length + 1}`);
      this.queue.push({
        request: requestFn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      
      // Start queue processing if not already started
      if (!this.timer) {
        this.startQueueProcessing();
      }
    });
  }
  
  /**
   * Removes timestamps that are outside of the rate limit interval
   */
  private cleanTimestamps(): void {
    const cutoff = Date.now() - this.options.interval;
    this.requestTimestamps = this.requestTimestamps.filter(time => time >= cutoff);
  }
  
  /**
   * Starts processing the queue on a timer
   */
  private startQueueProcessing(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    
    this.timer = setTimeout(() => {
      this.processQueue();
    }, this.calculateNextSlot());
  }
  
  /**
   * Processes the next item in the queue if possible
   */
  private processQueue(): void {
    // Clear the timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    // If queue is empty or throttling is disabled, stop processing
    if (this.queue.length === 0 || !this.options.enabled) {
      return;
    }
    
    // Clean timestamps and check if we can process a request
    this.cleanTimestamps();
    if (this.requestTimestamps.length < this.options.limit) {
      // We can process one request
      const item = this.queue.shift();
      if (item) {
        this.requestTimestamps.push(Date.now());
        Logger.debug(`Processing queued request. Remaining queue size: ${this.queue.length}`);
        
        item.request()
          .then(item.resolve)
          .catch(item.reject)
          .finally(() => {
            // Continue processing queue if there are more items
            if (this.queue.length > 0) {
              this.startQueueProcessing();
            }
          });
      }
    } else {
      // We're still at the limit, schedule the next check
      this.startQueueProcessing();
    }
  }
  
  /**
   * Calculates the time until the next request slot is available
   */
  private calculateNextSlot(): number {
    if (this.requestTimestamps.length === 0) {
      return 0;
    }
    
    // Find the earliest timestamp
    const oldest = Math.min(...this.requestTimestamps);
    // Calculate when it will expire from the window
    const nextSlot = oldest + this.options.interval - Date.now();
    
    // Add a small buffer (10ms)
    return Math.max(10, nextSlot);
  }
  
  /**
   * Clears the queue, rejecting all pending requests
   */
  clearQueue(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    const queuedRequests = this.queue.length;
    if (queuedRequests > 0) {
      Logger.warn(`Clearing throttling queue with ${queuedRequests} pending requests`);
      
      this.queue.forEach(item => {
        item.reject(new Error('Request cancelled: throttling queue cleared'));
      });
      
      this.queue = [];
    }
  }
}