import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissionGuard } from '../usePermissionGuard';
import * as authHook from '../useAuth';

vi.mock('../useAuth');

describe('usePermissionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar true quando usuário tem permissão', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      checkPermission: vi.fn().mockReturnValue(true),
    } as any);

    const { result } = renderHook(() =>
      usePermissionGuard('financial', 'create')
    );

    expect(result.current.hasPermission).toBe(true);
  });

  it('deve retornar false quando usuário não tem permissão', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      checkPermission: vi.fn().mockReturnValue(false),
    } as any);

    const { result } = renderHook(() =>
      usePermissionGuard('financial', 'delete')
    );

    expect(result.current.hasPermission).toBe(false);
  });

  it('deve verificar múltiplas permissões corretamente', () => {
    const mockCheckPermission = vi.fn((module, action) => {
      return module === 'financial' && action === 'create';
    });

    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      checkPermission: mockCheckPermission,
    } as any);

    const { result: result1 } = renderHook(() =>
      usePermissionGuard('financial', 'create')
    );
    const { result: result2 } = renderHook(() =>
      usePermissionGuard('financial', 'delete')
    );

    expect(result1.current.hasPermission).toBe(true);
    expect(result2.current.hasPermission).toBe(false);
  });

  it('deve retornar false quando checkPermission não existe', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({} as any);

    const { result } = renderHook(() =>
      usePermissionGuard('financial', 'create')
    );

    expect(result.current.hasPermission).toBe(false);
  });
});
