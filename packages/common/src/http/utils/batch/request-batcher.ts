/**
 * Request batching utility for grouping similar API requests
 */
import { Logger } from '../../../utils/logger';
import type { RequestOptions, HttpResponse } from '../../core/http-types';

/**
 * Options for request batching
 */
export interface BatchOptions {
  /**
   * Whether batching is enabled
   * @default false
   */
  enabled?: boolean;
  
  /**
   * Maximum batch size
   * @default 10
   */
  maxBatchSize?: number;
  
  /**
   * Debounce time in milliseconds
   * @default 50
   */
  debounceTime?: number;
  
  /**
   * Maximum wait time for a batch in milliseconds
   * @default 200
   */
  maxWaitTime?: number;
  
  /**
   * Custom batch key generator
   * Groups requests with the same key into the same batch
   * @default Groups by endpoint (URL path)
   */
  batchKeyGenerator?: (request: RequestOptions) => string;
}

/**
 * Request batcher for optimizing API calls
 * Groups similar requests together to reduce API load
 */
export class RequestBatcher {
  private batches = new Map<string, {
    requests: Array<{
      request: RequestOptions;
      resolve: (response: HttpResponse) => void;
      reject: (error: unknown) => void;
    }>;
    timer: NodeJS.Timeout | null;
    createdAt: number;
  }>();
  
  private options: Required<BatchOptions> = {
    enabled: false,
    maxBatchSize: 10,
    debounceTime: 50,
    maxWaitTime: 200,
    batchKeyGenerator: this.defaultBatchKeyGenerator,
  };
  
  constructor(options: BatchOptions = {}) {
    this.configure(options);
  }
  
  /**
   * Default batch key generator
   * Groups requests by URL path (ignoring query parameters)
   */
  private defaultBatchKeyGenerator(request: RequestOptions): string {
    // Extract the path part of the URL (remove query parameters)
    const url = request.url.split('?')[0];
    return `${request.method}:${url}`;
  }
  
  /**
   * Updates batcher configuration
   */
  configure(options: BatchOptions): void {
    this.options = {
      ...this.options,
      ...options,
    };
    
    // If batching was disabled, process all pending batches
    if (options.enabled === false) {
      this.processPendingBatches();
    }
  }
  
  /**
   * Adds a request to a batch or processes it immediately if batching is disabled
   * @returns A promise that resolves with the response
   */
  add<T = unknown>(
    request: RequestOptions,
    processBatch: (requests: RequestOptions[]) => Promise<HttpResponse<T>[]>,
  ): Promise<HttpResponse<T>> {
    // If batching is disabled, process the request immediately
    if (!this.options.enabled) {
      return processBatch([request]).then(responses => responses[0]);
    }
    
    return new Promise<HttpResponse<T>>((resolve, reject) => {
      const batchKey = this.options.batchKeyGenerator(request);
      let batch = this.batches.get(batchKey);
      
      // Create a new batch if one doesn't exist
      if (!batch) {
        batch = {
          requests: [],
          timer: null,
          createdAt: Date.now(),
        };
        this.batches.set(batchKey, batch);
      }
      
      // Add the request to the batch
      batch.requests.push({
        request,
        resolve: resolve as (response: HttpResponse) => void,
        reject,
      });
      
      // Clear existing timer when adding a new request
      if (batch.timer) {
        clearTimeout(batch.timer);
        batch.timer = null;
      }
      
      // Process immediately if we've reached max batch size
      if (batch.requests.length >= this.options.maxBatchSize) {
        Logger.debug(`Processing batch of ${batch.requests.length} requests (max size reached)`);
        this.processBatch(batchKey, processBatch);
        return;
      }
      
      // Check if we've exceeded the max wait time
      const waitedTime = Date.now() - batch.createdAt;
      if (waitedTime >= this.options.maxWaitTime) {
        Logger.debug(`Processing batch of ${batch.requests.length} requests (max wait time reached)`);
        this.processBatch(batchKey, processBatch);
        return;
      }
      
      // Set a new timer to process the batch after the debounce time
      // or the remaining time until max wait time is reached
      const remainingWaitTime = Math.min(
        this.options.debounceTime,
        this.options.maxWaitTime - waitedTime
      );
      
      batch.timer = setTimeout(() => {
        Logger.debug(`Processing batch of ${batch.requests.length} requests (timer expired)`);
        this.processBatch(batchKey, processBatch);
      }, remainingWaitTime);
    });
  }
  
  /**
   * Processes a specific batch of requests
   */
  private processBatch<T = unknown>(
    batchKey: string,
    processBatch: (requests: RequestOptions[]) => Promise<HttpResponse<T>[]>,
  ): void {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.requests.length === 0) {
      return;
    }
    
    // Remove the batch
    this.batches.delete(batchKey);
    
    // Clear any existing timer
    if (batch.timer) {
      clearTimeout(batch.timer);
      batch.timer = null;
    }
    
    // Extract requests and callbacks
    const { requests } = batch;
    const requestConfigs = requests.map(r => r.request);
    
    // Process the batch
    processBatch(requestConfigs)
      .then(responses => {
        // Match responses with requests
        if (responses.length !== requests.length) {
          Logger.error(`Batch response count (${responses.length}) doesn't match request count (${requests.length})`);
          // Reject all requests with an error
          requests.forEach(({ reject }) => {
            reject(new Error('Batch processing failed: response count mismatch'));
          });
          return;
        }
        
        // Resolve each request with its corresponding response
        requests.forEach(({ resolve }, index) => {
          resolve(responses[index]);
        });
      })
      .catch(error => {
        // Reject all requests with the same error
        requests.forEach(({ reject }) => {
          reject(error);
        });
      });
  }
  
  /**
   * Processes all pending batches
   */
  private processPendingBatches(): void {
    for (const batchKey of this.batches.keys()) {
      const batch = this.batches.get(batchKey);
      if (batch && batch.timer) {
        clearTimeout(batch.timer);
        batch.timer = null;
        
        // Reject all requests in the batch
        batch.requests.forEach(({ reject }) => {
          reject(new Error('Batch processing cancelled: batching was disabled'));
        });
        
        this.batches.delete(batchKey);
      }
    }
  }
  
  /**
   * Cancels all pending batches
   */
  cancelAll(): void {
    this.processPendingBatches();
  }
}