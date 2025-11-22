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

    const { result } = renderHook(() => usePermissionGuard());

    const hasPermission = result.current.hasPermission('financial', 'create');
    expect(hasPermission).toBe(true);
  });

  it('deve retornar false quando usuário não tem permissão', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      checkPermission: vi.fn().mockReturnValue(false),
    } as any);

    const { result } = renderHook(() => usePermissionGuard());

    const hasPermission = result.current.hasPermission('financial', 'delete');
    expect(hasPermission).toBe(false);
  });

  it('deve verificar múltiplas permissões corretamente', () => {
    const mockCheckPermission = vi.fn((module, action) => {
      return module === 'financial' && action === 'create';
    });

    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      checkPermission: mockCheckPermission,
    } as any);

    const { result } = renderHook(() => usePermissionGuard());

    const hasCreatePermission = result.current.hasPermission('financial', 'create');
    const hasDeletePermission = result.current.hasPermission('financial', 'delete');

    expect(hasCreatePermission).toBe(true);
    expect(hasDeletePermission).toBe(false);
  });

  it('deve retornar false quando checkPermission não existe', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({} as any);

    const { result } = renderHook(() => usePermissionGuard());

    const hasPermission = result.current.hasPermission('financial', 'create');
    expect(hasPermission).toBe(false);
  });
});
