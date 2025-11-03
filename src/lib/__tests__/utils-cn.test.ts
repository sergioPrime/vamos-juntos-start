import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('utils - cn function', () => {
  it('deve mesclar classes simples', () => {
    const result = cn('class1', 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('deve ignorar valores falsy', () => {
    const result = cn('base', null, undefined, false, '');
    expect(result).toContain('base');
    expect(result).not.toContain('null');
    expect(result).not.toContain('undefined');
  });

  it('deve lidar com classes condicionais', () => {
    const isActive = true;
    const isDisabled = false;
    
    const result = cn(
      'base',
      isActive && 'active',
      isDisabled && 'disabled'
    );
    
    expect(result).toContain('base');
    expect(result).toContain('active');
    expect(result).not.toContain('disabled');
  });

  it('deve resolver conflitos de classes Tailwind', () => {
    // tailwind-merge deve manter apenas a última classe conflitante
    const result = cn('p-4', 'p-6');
    expect(result).toContain('p-6');
  });

  it('deve mesclar arrays de classes', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
    expect(result).toContain('class3');
  });

  it('deve lidar com objetos de classes', () => {
    const result = cn({
      active: true,
      disabled: false,
      'custom-class': true
    });
    
    expect(result).toContain('active');
    expect(result).not.toContain('disabled');
    expect(result).toContain('custom-class');
  });

  it('deve combinar múltiplos tipos de argumentos', () => {
    const result = cn(
      'base',
      ['array1', 'array2'],
      { conditional: true },
      true && 'truthy',
      false && 'falsy'
    );
    
    expect(result).toContain('base');
    expect(result).toContain('array1');
    expect(result).toContain('conditional');
    expect(result).toContain('truthy');
    expect(result).not.toContain('falsy');
  });

  it('deve lidar com classes Tailwind responsivas', () => {
    const result = cn('text-sm', 'md:text-base', 'lg:text-lg');
    expect(result).toContain('text-sm');
    expect(result).toContain('md:text-base');
    expect(result).toContain('lg:text-lg');
  });

  it('deve lidar com estados hover e focus', () => {
    const result = cn(
      'bg-blue-500',
      'hover:bg-blue-600',
      'focus:ring-2'
    );
    
    expect(result).toContain('bg-blue-500');
    expect(result).toContain('hover:bg-blue-600');
    expect(result).toContain('focus:ring-2');
  });

  it('deve retornar string vazia para entrada vazia', () => {
    const result = cn();
    expect(result).toBe('');
  });
});
