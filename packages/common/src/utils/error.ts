/**
 * Creates an extended Error object with additional properties
 *
 * @param message - Error message
 * @param status - HTTP status code
 * @param code - Error code
 * @param details - Additional error details
 * @returns Extended Error object
 */
export function createError(
  message: string,
  status?: number,
  code?: string,
  details?: unknown,
): Error & { status?: number; code?: string; details?: unknown } {
  const error = new Error(message);
  
  // Add additional properties
  if (status !== undefined) {
    Object.defineProperty(error, 'status', {
      value: status,
      enumerable: true,
      writable: true,
    });
  }
  
  if (code !== undefined) {
    Object.defineProperty(error, 'code', {
      value: code,
      enumerable: true,
      writable: true,
    });
  }
  
  if (details !== undefined) {
    Object.defineProperty(error, 'details', {
      value: details,
      enumerable: true,
      writable: true,
    });
  }
  
  return error as Error & { status?: number; code?: string; details?: unknown };
}