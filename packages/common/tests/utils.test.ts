import { describe, expect, it } from 'vitest';
import { formatName } from '../src/utils';

describe('formatName', () => {
  it('should convert to camelCase', () => {
    expect(formatName('User Api')).toBe('userApi');
    expect(formatName('Order-Management')).toBe('orderManagement');
    expect(formatName('PRODUCT_CATALOG')).toBe('productCatalog');
  });

  it('should handle single words correctly', () => {
    expect(formatName('users')).toBe('users');
    expect(formatName('Users')).toBe('users');
  });

  it('should handle empty strings', () => {
    expect(formatName('')).toBe('');
  });
});
