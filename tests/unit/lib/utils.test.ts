import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const result = cn('foo', false && 'bar', 'baz');
    expect(result).toBe('foo baz');
  });

  it('handles undefined and null', () => {
    const result = cn('foo', undefined, null, 'bar');
    expect(result).toBe('foo bar');
  });

  it('handles empty strings', () => {
    const result = cn('', 'foo', '', 'bar');
    expect(result).toBe('foo bar');
  });

  it('handles arrays', () => {
    const result = cn(['foo', 'bar'], 'baz');
    expect(result).toBe('foo bar baz');
  });

  it('handles objects for conditional classes', () => {
    const result = cn('foo', { bar: true, baz: false });
    expect(result).toBe('foo bar');
  });

  it('handles mixed inputs', () => {
    const result = cn('foo', ['bar', 'baz'], { qux: true }, false && 'quux');
    expect(result).toBe('foo bar baz qux');
  });

  it('preserves duplicate classes within a single string', () => {
    const result = cn('foo foo bar');
    expect(result).toBe('foo foo bar');
  });

  it('handles tailwind-merge conflicting classes', () => {
    const result = cn('px-2 px-4', 'py-1 py-2');
    expect(result).toBe('px-4 py-2');
  });
});
