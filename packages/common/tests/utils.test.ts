import { describe, expect, it } from 'vitest';
import { formatName } from '../src/utils';

describe('formatName', () => {
  it('should convert to camelCase by default', () => {
    expect(formatName('User Api')).toBe('userApi');
    expect(formatName('Order-Management')).toBe('orderManagement');
    expect(formatName('PRODUCT_CATALOG')).toBe('productCatalog');
  });

  it('should convert to PascalCase when specified', () => {
    expect(formatName('user api', 'PascalCase')).toBe('UserApi');
    expect(formatName('order-management', 'PascalCase')).toBe('OrderManagement');
    expect(formatName('product_catalog', 'PascalCase')).toBe('ProductCatalog');
  });

  it('should convert to kebab-case when specified', () => {
    expect(formatName('UserApi', 'kebab-case')).toBe('user-api');
    expect(formatName('OrderManagement', 'kebab-case')).toBe('order-management');
    expect(formatName('ProductCatalog', 'kebab-case')).toBe('product-catalog');
  });

  it('should handle single words correctly', () => {
    expect(formatName('users', 'camelCase')).toBe('users');
    expect(formatName('users', 'PascalCase')).toBe('Users');
    expect(formatName('Users', 'kebab-case')).toBe('users');
  });

  it('should handle empty strings', () => {
    expect(formatName('')).toBe('');
    expect(formatName('', 'PascalCase')).toBe('');
    expect(formatName('', 'kebab-case')).toBe('');
  });
});
