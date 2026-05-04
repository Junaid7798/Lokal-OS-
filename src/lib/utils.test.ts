import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle falsy values', () => {
    const falsyValue = false;
    expect(cn('foo', falsyValue && 'bar', 'baz')).toBe('foo baz');
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isInactive = false;
    expect(cn('base', isActive && 'active')).toBe('base active');
    expect(cn('base', isInactive && 'active')).toBe('base');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2 px-4')).toBe('px-4');
    expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
  });
});
