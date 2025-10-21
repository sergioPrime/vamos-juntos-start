import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class');
      expect(result).toContain('base-class');
      expect(result).toContain('additional-class');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base', isActive && 'active');
      expect(result).toContain('base');
      expect(result).toContain('active');
    });

    it('should handle false/null/undefined values', () => {
      const result = cn('base', false && 'false-class', null, undefined);
      expect(result).toBe('base');
    });

    it('should override conflicting Tailwind classes', () => {
      const result = cn('text-red-500', 'text-blue-500');
      // tailwind-merge should keep only the last color
      expect(result).toContain('text-blue-500');
      expect(result).not.toContain('text-red-500');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });
  });
});
