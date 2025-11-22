import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useStockValidation } from '../useStockValidation'
import { supabase } from '@/integrations/supabase/client'

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          })),
          in: vi.fn()
        }))
      }))
    })),
    rpc: vi.fn()
  }
}))

// Mock contexts
vi.mock('../useOrganization', () => ({
  useOrganization: () => ({
    currentOrg: { id: 'org-123' }
  })
}))

vi.mock('../use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

describe('useStockValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateSingleProduct', () => {
    it('should return valid for sufficient stock', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Product Test',
        active: true,
        stock_quantity: 100
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [mockProduct],
                error: null
              })
            })
          })
        })
      } as any)

      const { result } = renderHook(() => useStockValidation())

      const validation = await result.current.validateSingleProduct('product-1', 50)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should return error for insufficient stock', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Product Test',
        active: true,
        stock_quantity: 10
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [mockProduct],
                error: null
              })
            })
          })
        })
      } as any)

      const { result } = renderHook(() => useStockValidation())

      const validation = await result.current.validateSingleProduct('product-1', 50)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toHaveLength(1)
      expect(validation.errors[0]).toContain('Estoque insuficiente')
    })

    it('should return error for inactive product', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Product Test',
        active: false,
        stock_quantity: 100
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [mockProduct],
                error: null
              })
            })
          })
        })
      } as any)

      const { result } = renderHook(() => useStockValidation())

      const validation = await result.current.validateSingleProduct('product-1', 50)

      expect(validation.valid).toBe(false)
      expect(validation.errors[0]).toContain('inativo')
    })

    it('should return error for non-existent product', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      } as any)

      const { result } = renderHook(() => useStockValidation())

      const validation = await result.current.validateSingleProduct('invalid-id', 50)

      expect(validation.valid).toBe(false)
      expect(validation.errors[0]).toContain('não encontrado')
    })
  })

  describe('validateOrderStock', () => {
    it('should validate multiple items successfully', async () => {
      const mockProducts = [
        { id: 'p1', name: 'Product 1', active: true, stock_quantity: 100 },
        { id: 'p2', name: 'Product 2', active: true, stock_quantity: 50 }
      ]

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: mockProducts,
                error: null
              })
            })
          })
        })
      } as any)

      const { result } = renderHook(() => useStockValidation())

      const items = [
        { productId: 'p1', quantity: 10 },
        { productId: 'p2', quantity: 5 }
      ]

      const validation = await result.current.validateOrderStock(items)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect low stock warnings', async () => {
      const mockProduct = {
        id: 'p1',
        name: 'Product 1',
        active: true,
        stock_quantity: 15,
        min_stock_level: 10
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [mockProduct],
                error: null
              })
            })
          })
        })
      } as any)

      const { result } = renderHook(() => useStockValidation())

      const validation = await result.current.validateOrderStock([
        { productId: 'p1', quantity: 10 }
      ])

      expect(validation.valid).toBe(true)
      expect(validation.warnings).toHaveLength(1)
      expect(validation.warnings[0]).toContain('estoque baixo')
    })
  })

  describe('getWarehouseStock', () => {
    it('should return warehouse stock quantity', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: 75,
        error: null
      } as any)

      const { result } = renderHook(() => useStockValidation())

      const stock = await result.current.getWarehouseStock('product-1', 'warehouse-1')

      expect(stock).toBe(75)
      expect(supabase.rpc).toHaveBeenCalledWith('get_warehouse_stock', {
        p_product_id: 'product-1',
        p_warehouse_id: 'warehouse-1'
      })
    })

    it('should return 0 on error', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: new Error('RPC Error')
      } as any)

      const { result } = renderHook(() => useStockValidation())

      const stock = await result.current.getWarehouseStock('product-1', 'warehouse-1')

      expect(stock).toBe(0)
    })
  })

  describe('checkLowStock', () => {
    it('should return list of low stock products', async () => {
      const mockLowStock = [
        { id: 'p1', name: 'Product 1', stock_quantity: 5, min_stock_level: 10 },
        { id: 'p2', name: 'Product 2', stock_quantity: 2, min_stock_level: 15 }
      ]

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockLowStock,
        error: null
      } as any)

      const { result } = renderHook(() => useStockValidation())

      const lowStock = await result.current.checkLowStock()

      expect(lowStock).toHaveLength(2)
      expect(lowStock[0].name).toBe('Product 1')
    })
  })
})
