import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAccessRequests } from '@/hooks/useAccessRequests';
import { supabase } from '@/integrations/supabase/client';
import { AllTheProviders } from '@/test/utils/renderWithProviders';

vi.mock('@/integrations/supabase/client');
vi.mock('@/hooks/useOrganization', () => ({
  useOrganization: () => ({ currentOrg: { id: 'org-123' } }),
}));

describe('Permission Request Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve criar solicitação de acesso', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: {
          id: 'request-123',
          module_key: 'financeiro',
          permissions: { create: true, read: true },
          status: 'pending',
        },
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useAccessRequests(), {
      wrapper: AllTheProviders,
    });

    let success = false;
    await act(async () => {
      success = await result.current.createRequest({
        module_key: 'financeiro',
        permissions: { create: true, read: true },
        justification: 'Preciso criar lançamentos',
      } as any);
    });

    expect(success).toBe(true);
  });

  it('deve aprovar solicitação de acesso', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useAccessRequests(), {
      wrapper: AllTheProviders,
    });

    let success = false;
    await act(async () => {
      success = await result.current.approveRequest('request-123', 'admin-123');
    });

    expect(success).toBe(true);
  });

  it('deve rejeitar solicitação de acesso', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useAccessRequests(), {
      wrapper: AllTheProviders,
    });

    let success = false;
    await act(async () => {
      success = await result.current.rejectRequest(
        'request-123',
        'admin-123',
        'Não aprovado'
      );
    });

    expect(success).toBe(true);
  });
});
