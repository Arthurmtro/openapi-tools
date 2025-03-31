/**
 * HTTP request cache utility
 */
import type { CacheOptions, RequestOptions, HttpResponse } from '../../core/http-types';
import { Logger } from '../../../utils/logger';

/**
 * Default cache TTL in milliseconds (1 minute)
 */
const DEFAULT_CACHE_TTL = 60000;

/**
 * Default maximum cache entries
 */
const DEFAULT_MAX_ENTRIES = 100;

/**
 * Default cacheable HTTP methods
 */
const DEFAULT_CACHEABLE_METHODS = ['GET'];

/**
 * HTTP request cache manager
 * Lightweight in-memory cache for HTTP requests
 */
export class RequestCache {
  private cache = new Map<string, { response: HttpResponse; timestamp: number }>();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      enabled: options.enabled ?? false,
      keyGenerator: options.keyGenerator ?? this.defaultKeyGenerator,
      ttl: options.ttl ?? DEFAULT_CACHE_TTL,
      maxEntries: options.maxEntries ?? DEFAULT_MAX_ENTRIES,
      methods: options.methods ?? (DEFAULT_CACHEABLE_METHODS as Array<'GET' | 'HEAD' | 'OPTIONS'>),
    };
  }

  /**
   * Default cache key generator
   * Creates a unique key from URL, method, and sorted query parameters
   */
  private defaultKeyGenerator(request: RequestOptions): string {
    const { url, method, params } = request;
    const sortedParams = params
      ? Object.entries(params)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .map(([key, value]) => `${key}=${value}`)
          .join('&')
      : '';

    return `${method}:${url}${sortedParams ? `?${sortedParams}` : ''}`;
  }

  /**
   * Checks if a request can be cached based on its method
   */
  private isCacheable(request: RequestOptions): boolean {
    return this.options.enabled && this.options.methods.includes(request.method as any);
  }

  /**
   * Gets a response from cache if valid
   * @returns The cached response or undefined if not found or expired
   */
  get(request: RequestOptions): HttpResponse | undefined {
    if (!this.isCacheable(request)) {
      return undefined;
    }

    const key = this.options.keyGenerator(request);
    const cached = this.cache.get(key);

    if (!cached) {
      return undefined;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.options.ttl) {
      // Remove expired entry
      this.cache.delete(key);
      return undefined;
    }

    Logger.debug(`Cache hit: ${key}`);
    return cached.response;
  }

  /**
   * Stores a response in cache
   */
  set(request: RequestOptions, response: HttpResponse): void {
    if (!this.isCacheable(request)) {
      return;
    }

    // Don't cache error responses
    if (response.status >= 400) {
      return;
    }

    const key = this.options.keyGenerator(request);

    // Remove oldest entry if at capacity
    if (this.cache.size >= this.options.maxEntries) {
      const oldestKey = this.findOldestCacheKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    Logger.debug(`Cache set: ${key}`);
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });
  }

  /**
   * Finds the oldest entry in the cache
   */
  private findOldestCacheKey(): string | undefined {
    let oldestKey: string | undefined;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Clears the entire cache
   */
  clear(): void {
    const count = this.cache.size;
    this.cache.clear();
    Logger.debug(`Cache cleared: ${count} entries removed`);
  }

  /**
   * Clears cache entries that match a URL pattern
   */
  clearPattern(urlPattern: string | RegExp): void {
    const pattern =
      typeof urlPattern === 'string'
        ? new RegExp(urlPattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
        : urlPattern;

    let count = 0;
    for (const [key] of this.cache.entries()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      Logger.debug(`Cache pattern cleared: ${count} entries removed`);
    }
  }

  /**
   * Updates cache configuration
   */
  configure(options: CacheOptions): void {
    this.options = {
      ...this.options,
      ...options,
    };

    // If cache was disabled, clear it
    if (options.enabled === false) {
      this.clear();
    }
  }
}
