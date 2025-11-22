import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInstallments } from '../useInstallments';
import { supabase } from '@/integrations/supabase/client';
import { AllTheProviders } from '@/test/utils/renderWithProviders';

vi.mock('@/integrations/supabase/client');
vi.mock('../useOrganization', () => ({
  useOrganization: () => ({ organization: { id: 'org-123' } }),
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

    await waitFor(() => {
      expect(result.current.installments).toHaveLength(2);
      expect(result.current.loading).toBe(false);
    });
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

  it('deve simular pagamento com encargos', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              amount: 100,
              due_date: '2025-01-20',
              entry: {
                bank_account: {
                  late_fee: 2,
                  monthly_interest: 1,
                  discount_until_due: 0,
                },
              },
            },
            error: null,
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useInstallments(), {
      wrapper: AllTheProviders,
    });

    let simulation = null;
    await act(async () => {
      simulation = await result.current.simulatePayment(
        'installment-123',
        '2025-01-25'
      );
    });

    expect(simulation).toBeDefined();
    expect(simulation?.originalAmount).toBe(100);
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
      success = await result.current.settleWithCharges({
        installmentId: 'installment-123',
        paymentDate: '2025-01-25',
        paymentMethodId: 'method-123',
        bankAccountId: 'account-123',
        lateFee: 2,
        interestAmount: 1,
        discountAmount: 0,
        finalAmount: 103,
      });
    });

    expect(success).toBe(true);
  });
});
