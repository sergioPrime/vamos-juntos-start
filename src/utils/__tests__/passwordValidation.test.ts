import { describe, it, expect } from 'vitest';
import { validatePassword } from '../passwordValidation';

describe('passwordValidation', () => {
  describe('validatePassword', () => {
    it('should return error for passwords shorter than 8 characters', () => {
      const result = validatePassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha deve ter no mínimo 8 caracteres');
    });

    it('should return error for passwords without uppercase letters', () => {
      const result = validatePassword('lowercase1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha deve conter pelo menos uma letra maiúscula');
    });

    it('should return error for passwords without lowercase letters', () => {
      const result = validatePassword('UPPERCASE1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha deve conter pelo menos uma letra minúscula');
    });

    it('should return error for passwords without numbers', () => {
      const result = validatePassword('NoNumber!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha deve conter pelo menos um número');
    });

    it('should return error for passwords without special characters', () => {
      const result = validatePassword('NoSpecial1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Senha deve conter pelo menos um caractere especial');
    });

    it('should validate correct password', () => {
      const result = validatePassword('ValidPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle multiple errors', () => {
      const result = validatePassword('short');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('password strength in validation', () => {
    it('should return strength in result', () => {
      const weak = validatePassword('Short1!');
      const strong = validatePassword('VeryStrongP@ssw0rd123!');
      expect(['weak', 'medium', 'strong']).toContain(weak.strength);
      expect(['weak', 'medium', 'strong']).toContain(strong.strength);
    });
  });
});
