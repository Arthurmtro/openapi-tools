/**
 * Convert a string to kebab-case
 */
export function toKebabCase(str: string): string {
  return (
    str
      // Insert hyphen before uppercase letters
      .replace(/([A-Z])/g, '-$1')
      // Handle special case for strings that might start with uppercase
      .replace(/^-/, '')
      // Replace non-alphanumeric with hyphen
      .replace(/[^a-zA-Z0-9]/g, '-')
      // Convert to lowercase
      .toLowerCase()
      // Remove consecutive hyphens
      .replace(/-+/g, '-')
      // Remove trailing hyphen
      .replace(/-$/, '')
  );
}

/**
 * Format a group name according to the specified convention
 */
export function formatName(
  name: string,
  convention: 'camelCase' | 'kebab-case' | 'PascalCase' = 'camelCase',
): string {
  // Split the string into words, handling various delimiters
  const words = name.split(/[-_\s]+/).filter(Boolean);

  if (words.length === 0) return '';

  switch (convention) {
    case 'camelCase':
      return words
        .map((word, index) => {
          return index === 0
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');

    case 'PascalCase':
      return words
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');

    case 'kebab-case':
      // For kebab-case, we need a different approach to handle camelCase input
      if (words.length === 1 && /[A-Z]/.test(words[0])) {
        // If we have a single word with capital letters (like "UserApi")
        return toKebabCase(words[0]);
      }
      return words.map((word) => word.toLowerCase()).join('-');
  }
}

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
