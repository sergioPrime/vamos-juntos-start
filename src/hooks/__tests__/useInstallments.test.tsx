import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInstallments } from '../useInstallments';
import { supabase } from '@/integrations/supabase/client';
import { AllTheProviders } from '@/test/utils/renderWithProviders';

vi.mock('@/integrations/supabase/client');
vi.mock('../useOrganization', () => ({
  useOrganization: () => ({ currentOrganization: { id: 'org-123' } }),
}));

describe('useInstallments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar parcelas de um lançamento', async () => {
    const mockInstallments = [
      {
        id: '1',
        installment_number: 1,
        amount: 100,
        due_date: '2025-02-01',
        is_settled: false,
      },
      {
        id: '2',
        installment_number: 2,
        amount: 100,
        due_date: '2025-03-01',
        is_settled: false,
      },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockInstallments,
            error: null,
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useInstallments(), {
      wrapper: AllTheProviders,
    });

    await act(async () => {
      await result.current.loadInstallments('entry-123');
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.installments).toHaveLength(2);
    expect(result.current.loading).toBe(false);
  });

  it('deve gerar parcelas corretamente', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useInstallments(), {
      wrapper: AllTheProviders,
    });

    let success = false;
    await act(async () => {
      success = await result.current.generateInstallments({
        entryId: 'entry-123',
        numInstallments: 3,
        firstDueDate: '2025-02-01',
        totalAmount: 300,
      });
    });

    expect(success).toBe(true);
  });

  it('deve quitar parcela com sucesso', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useInstallments(), {
      wrapper: AllTheProviders,
    });

    let success = false;
    await act(async () => {
      success = await result.current.settleInstallment('installment-123', 100);
    });

    expect(success).toBe(true);
  });

  it('deve cancelar quitação de parcela', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(() => useInstallments(), {
      wrapper: AllTheProviders,
    });

    let success = false;
    await act(async () => {
      success = await result.current.unsettleInstallment('installment-123');
    });

    expect(success).toBe(true);
  });
});
