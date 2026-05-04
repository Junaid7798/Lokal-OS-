import { describe, it, expect } from 'vitest';
import {
  cleanPhoneNumber,
  isValidPhoneNumber,
  validateEmail,
} from './validation';

describe('cleanPhoneNumber', () => {
  it('should remove non-digit characters except leading +', () => {
    expect(cleanPhoneNumber('+1 (234) 567-8900')).toBe('+12345678900');
    expect(cleanPhoneNumber('9876543210')).toBe('9876543210');
    expect(cleanPhoneNumber('+91 98765 43210')).toBe('+919876543210');
  });

  it('should handle empty strings', () => {
    expect(cleanPhoneNumber('')).toBe('');
  });
});

describe('isValidPhoneNumber', () => {
  it('should validate Indian mobile numbers', () => {
    expect(isValidPhoneNumber('9876543210')).toBe(true);
    expect(isValidPhoneNumber('+919876543210')).toBe(true);
    expect(isValidPhoneNumber('12345')).toBe(false);
  });

  it('should reject invalid numbers', () => {
    expect(isValidPhoneNumber('')).toBe(false);
    expect(isValidPhoneNumber('abc')).toBe(false);
  });
});

describe('validateEmail', () => {
  it('should validate email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.in')).toBe(true);
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('invalid@')).toBe(false);
  });
});
