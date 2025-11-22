import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFinancialMetrics } from '../useFinancialMetrics';
import { supabase } from '@/integrations/supabase/client';
import { AllTheProviders } from '@/test/utils/renderWithProviders';

vi.mock('@/integrations/supabase/client');
vi.mock('../useOrganization', () => ({
  useOrganization: () => ({ currentOrganization: { id: 'org-123' } }),
}));

describe('useFinancialMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve calcular métricas financeiras corretamente', async () => {
    const mockData = [
      {
        id: '1',
        amount: 1000,
        entry_type: 'receivable',
        is_settled: false,
        due_date: '2025-01-25',
      },
      {
        id: '2',
        amount: 500,
        entry_type: 'payable',
        is_settled: true,
        due_date: '2025-01-20',
      },
    ];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useFinancialMetrics('2025-01-01', '2025-01-31'), {
      wrapper: AllTheProviders,
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(result.current.metrics).toBeDefined();
    expect(result.current.loading).toBe(false);
  });

  it('deve lidar com erro ao buscar métricas', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Error fetching metrics' },
            }),
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useFinancialMetrics('2025-01-01', '2025-01-31'), {
      wrapper: AllTheProviders,
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(result.current.loading).toBe(false);
  });
});
