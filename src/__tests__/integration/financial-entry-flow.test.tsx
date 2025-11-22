import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, waitFor } from '@/test/utils/renderWithProviders';
import { supabase } from '@/integrations/supabase/client';
import { useFinancialEntries } from '@/hooks/useFinancialEntries';
import { renderHook, act } from '@testing-library/react';
import { AllTheProviders } from '@/test/utils/renderWithProviders';

vi.mock('@/integrations/supabase/client');
vi.mock('@/hooks/useOrganization', () => ({
  useOrganization: () => ({ currentOrg: { id: 'org-123' } }),
}));

describe('Financial Entry Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve criar um lançamento financeiro com sucesso', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: {
          id: 'entry-123',
          amount: 1000,
          entry_type: 'receivable',
          description: 'Venda de produto',
        },
        error: null,
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    } as any);

    const { result } = renderHook(() => useFinancialEntries(), {
      wrapper: AllTheProviders,
    });

    let success = false;
    await act(async () => {
      const entry = {
        amount: 1000,
        entry_type: 'receivable',
        description: 'Venda de produto',
        due_date: '2025-02-01',
        person_type: 'customer',
      };
      success = await result.current.createEntry(entry as any);
    });

    expect(success).toBe(true);
  });

  it('deve listar lançamentos financeiros', async () => {
    const mockEntries = [
      {
        id: '1',
        amount: 1000,
        entry_type: 'receivable',
        is_settled: false,
        due_date: '2025-02-01',
      },
      {
        id: '2',
        amount: 500,
        entry_type: 'payable',
        is_settled: true,
        due_date: '2025-01-15',
      },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockEntries,
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useFinancialEntries(), {
      wrapper: AllTheProviders,
    });

    await act(async () => {
      await result.current.loadEntries();
    });

    await waitFor(() => {
      expect(result.current.entries).toHaveLength(2);
    });
  });

  it('deve quitar um lançamento financeiro', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useFinancialEntries(), {
      wrapper: AllTheProviders,
    });

    let success = false;
    await act(async () => {
      success = await result.current.settleEntry('entry-123', {
        settled_at: new Date().toISOString(),
        settled_payment_method_id: 'method-123',
      } as any);
    });

    expect(success).toBe(true);
  });
});
