import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStockValidation } from '../useStockValidation';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');
vi.mock('../useOrganization', () => ({
  useOrganization: () => ({ currentOrganization: { id: 'org-123' } }),
}));

describe('useStockValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve validar estoque para um produto', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { available_stock: 10 },
            error: null,
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useStockValidation());

    let isValid = false;
    await act(async () => {
      const validationResult = await result.current.validateSingleProduct('product-123', 5);
      isValid = validationResult.isValid;
    });

    expect(isValid).toBe(true);
  });

  it('deve retornar false quando estoque insuficiente', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { available_stock: 3 },
            error: null,
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useStockValidation());

    let isValid = true;
    await act(async () => {
      const validationResult = await result.current.validateSingleProduct('product-123', 5);
      isValid = validationResult.isValid;
    });

    expect(isValid).toBe(false);
  });

  it('deve validar múltiplos produtos em um pedido', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [
              { product_id: 'prod-1', available_stock: 10 },
              { product_id: 'prod-2', available_stock: 5 },
            ],
            error: null,
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useStockValidation());

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateOrderStock([
        { productId: 'prod-1', quantity: 5 },
        { productId: 'prod-2', quantity: 3 },
      ]);
    });

    expect(validationResult.isValid).toBe(true);
  });
});
