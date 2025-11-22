import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOrganization } from '../useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { AllTheProviders } from '@/test/utils/renderWithProviders';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('useOrganization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar organização quando usuário está autenticado', async () => {
    const mockUser = { id: 'user-123' };
    const mockOrg = { id: 'org-123', name: 'Test Org' };

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockOrg,
            error: null,
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useOrganization(), {
      wrapper: AllTheProviders,
    });

    // Wait for the hook to settle
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(result.current.currentOrganization).toEqual(mockOrg);
  });

  it('deve retornar null quando não há usuário autenticado', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    const { result } = renderHook(() => useOrganization(), {
      wrapper: AllTheProviders,
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(result.current.currentOrganization).toBeNull();
  });

  it('deve indicar loading durante busca', () => {
    vi.mocked(supabase.auth.getUser).mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useOrganization(), {
      wrapper: AllTheProviders,
    });

    expect(result.current.loading).toBe(true);
  });

  it('deve lidar com erro ao buscar organização', async () => {
    const mockUser = { id: 'user-123' };
    const mockError = new Error('Failed to fetch');

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useOrganization(), {
      wrapper: AllTheProviders,
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(result.current.currentOrganization).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
