/**
 * Creates a standard error object with a consistent format
 */
export function createError(
  message: string,
  status?: number,
  code?: string,
  details?: unknown,
): Error & { status?: number; code?: string; details?: unknown } {
  const error = new Error(message);
  // Add additional properties to the error object
  Object.assign(error, { status, code, details });
  return error;
}

/**
 * Format a name to camelCase
 */
export function formatName(name: string): string {
  // Split the string into words, handling various delimiters
  const words = name.split(/[-_\s]+/).filter(Boolean);

  if (words.length === 0) return '';

  // For camelCase, first word is lowercase, rest are capitalized
  return words
    .map((word, index) => {
      return index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}
