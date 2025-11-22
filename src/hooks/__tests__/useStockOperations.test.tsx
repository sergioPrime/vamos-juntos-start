import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useStockOperations } from '../useStockOperations'
import { supabase } from '@/integrations/supabase/client'

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn()
  }
}))

vi.mock('../useOrganization', () => ({
  useOrganization: () => ({
    currentOrg: { id: 'org-123' }
  })
}))

vi.mock('../useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' }
  })
}))

vi.mock('../use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

describe('useStockOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('transferStock', () => {
    it('should transfer stock atomically', async () => {
      const mockResult = {
        success: true,
        exit_movement_id: 'exit-123',
        entry_movement_id: 'entry-123',
        quantity_transferred: 50
      }

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockResult,
        error: null
      } as any)

      const { result } = renderHook(() => useStockOperations())

      const transfer = await result.current.transferStock({
        productId: 'product-1',
        warehouseFrom: 'warehouse-1',
        warehouseTo: 'warehouse-2',
        quantity: 50,
        reason: 'Reposição'
      })

      expect(transfer.success).toBe(true)
      expect(transfer.quantity_transferred).toBe(50)
      expect(supabase.rpc).toHaveBeenCalledWith('stock_transfer_atomic', {
        p_org_id: 'org-123',
        p_product_id: 'product-1',
        p_warehouse_from: 'warehouse-1',
        p_warehouse_to: 'warehouse-2',
        p_quantity: 50,
        p_lot_id: null,
        p_reason: 'Reposição',
        p_notes: null,
        p_created_by: 'user-123'
      })
    })

    it('should handle insufficient stock error', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: new Error('Estoque insuficiente')
      } as any)

      const { result } = renderHook(() => useStockOperations())

      await expect(
        result.current.transferStock({
          productId: 'product-1',
          warehouseFrom: 'warehouse-1',
          warehouseTo: 'warehouse-2',
          quantity: 1000
        })
      ).rejects.toThrow('Estoque insuficiente')
    })
  })

  describe('exitStock', () => {
    it('should register stock exit with validation', async () => {
      const mockResult = {
        success: true,
        movement_id: 'movement-123',
        quantity_exited: 25,
        remaining_stock: 75
      }

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockResult,
        error: null
      } as any)

      const { result } = renderHook(() => useStockOperations())

      const exit = await result.current.exitStock({
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantity: 25,
        exitType: 'sale',
        reason: 'Venda'
      })

      expect(exit.success).toBe(true)
      expect(exit.quantity_exited).toBe(25)
      expect(exit.remaining_stock).toBe(75)
    })

    it('should validate stock availability before exit', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: new Error('Estoque insuficiente')
      } as any)

      const { result } = renderHook(() => useStockOperations())

      await expect(
        result.current.exitStock({
          productId: 'product-1',
          quantity: 500
        })
      ).rejects.toThrow()
    })
  })

  describe('entryStock', () => {
    it('should register stock entry', async () => {
      const mockResult = {
        success: true,
        movement_id: 'movement-456',
        quantity_entered: 100
      }

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockResult,
        error: null
      } as any)

      const { result } = renderHook(() => useStockOperations())

      const entry = await result.current.entryStock({
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantity: 100,
        entryType: 'purchase',
        unitCost: 10.50,
        totalCost: 1050.00
      })

      expect(entry.success).toBe(true)
      expect(entry.quantity_entered).toBe(100)
    })

    it('should include cost information in entry', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true, movement_id: 'm1', quantity_entered: 50 },
        error: null
      } as any)

      const { result } = renderHook(() => useStockOperations())

      await result.current.entryStock({
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantity: 50,
        unitCost: 20.00,
        totalCost: 1000.00
      })

      expect(supabase.rpc).toHaveBeenCalledWith('stock_entry_atomic', 
        expect.objectContaining({
          p_unit_cost: 20.00,
          p_total_cost: 1000.00
        })
      )
    })
  })

  describe('error handling', () => {
    it('should throw error when organization is missing', async () => {
      vi.mocked(vi.fn(() => ({ currentOrg: null })))

      const { result } = renderHook(() => useStockOperations())

      await expect(
        result.current.transferStock({
          productId: 'product-1',
          warehouseFrom: 'w1',
          warehouseTo: 'w2',
          quantity: 10
        })
      ).rejects.toThrow('Organização ou usuário não identificado')
    })
  })
})
