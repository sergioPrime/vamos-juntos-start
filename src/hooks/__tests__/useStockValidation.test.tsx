import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStockValidation } from '../useStockValidation';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');
vi.mock('../useOrganization', () => ({
  useOrganization: () => ({ organization: { id: 'org-123' } }),
}));

describe('useStockValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve validar estoque disponível corretamente', async () => {
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
      isValid = await result.current.validateStock('product-123', 5);
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
      isValid = await result.current.validateStock('product-123', 5);
    });

    expect(isValid).toBe(false);
  });

  it('deve lidar com produto não encontrado', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Product not found' },
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useStockValidation());

    let isValid = true;
    await act(async () => {
      isValid = await result.current.validateStock('product-999', 5);
    });

    expect(isValid).toBe(false);
  });
});
