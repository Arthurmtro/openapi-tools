/**
 * Utility to detect which HTTP client implementation is available
 * This helps users know which client is being used in their environment
 */
export function detectHttpClientImplementation(): 'fetch' | 'axios' | 'custom' {
  try {
    // Try to import axios
    require('axios');
    return 'axios';
  } catch (_e) {
    // Fall back to fetch
    if (typeof globalThis.fetch === 'function') {
      return 'fetch';
    }
    // If no implementation is available, assume custom
    return 'custom';
  }
}
