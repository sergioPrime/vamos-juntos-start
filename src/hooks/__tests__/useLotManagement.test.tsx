import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLotManagement } from '../useLotManagement'
import { supabase } from '@/integrations/supabase/client'

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
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

describe('useLotManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('suggestLotFIFO', () => {
    it('should suggest lots following FIFO order', async () => {
      const mockLots = [
        {
          lot_id: 'lot-1',
          lot_number: 'LOT-001',
          available_quantity: 50,
          manufacturing_date: '2024-01-01',
          expiration_date: '2025-01-01',
          days_until_expiration: 180
        },
        {
          lot_id: 'lot-2',
          lot_number: 'LOT-002',
          available_quantity: 30,
          manufacturing_date: '2024-02-01',
          expiration_date: '2025-02-01',
          days_until_expiration: 210
        }
      ]

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockLots,
        error: null
      } as any)

      const { result } = renderHook(() => useLotManagement())

      const suggestions = await result.current.suggestLotFIFO('product-1', 'warehouse-1', 100)

      expect(suggestions).toHaveLength(2)
      expect(suggestions[0].lot_number).toBe('LOT-001')
      expect(supabase.rpc).toHaveBeenCalledWith('suggest_lot_fifo', {
        p_org_id: 'org-123',
        p_product_id: 'product-1',
        p_warehouse_id: 'warehouse-1',
        p_required_quantity: 100
      })
    })

    it('should handle empty result', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null
      } as any)

      const { result } = renderHook(() => useLotManagement())

      const suggestions = await result.current.suggestLotFIFO('product-1')

      expect(suggestions).toHaveLength(0)
    })
  })

  describe('validateLotFIFO', () => {
    it('should validate if lot follows FIFO', async () => {
      const mockValidation = {
        is_fifo_compliant: true,
        suggested_lot_id: 'lot-1',
        suggested_lot_number: 'LOT-001',
        warning_message: null
      }

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockValidation,
        error: null
      } as any)

      const { result } = renderHook(() => useLotManagement())

      const validation = await result.current.validateLotFIFO('product-1', 'lot-1')

      expect(validation.is_fifo_compliant).toBe(true)
      expect(validation.warning_message).toBeNull()
    })

    it('should return warning for non-FIFO selection', async () => {
      const mockValidation = {
        is_fifo_compliant: false,
        suggested_lot_id: 'lot-1',
        suggested_lot_number: 'LOT-001',
        warning_message: 'Atenção: O lote sugerido pelo FIFO é "LOT-001"'
      }

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockValidation,
        error: null
      } as any)

      const { result } = renderHook(() => useLotManagement())

      const validation = await result.current.validateLotFIFO('product-1', 'lot-2')

      expect(validation.is_fifo_compliant).toBe(false)
      expect(validation.warning_message).toContain('LOT-001')
    })
  })

  describe('getExpiringLotsAlert', () => {
    it('should return expiring lots with severity', async () => {
      const mockExpiringLots = [
        {
          lot_id: 'lot-1',
          lot_number: 'LOT-001',
          product_name: 'Product A',
          expiration_date: '2024-12-31',
          days_until_expiration: 5,
          severity: 'high'
        },
        {
          lot_id: 'lot-2',
          lot_number: 'LOT-002',
          product_name: 'Product B',
          expiration_date: '2025-01-15',
          days_until_expiration: 20,
          severity: 'medium'
        }
      ]

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockExpiringLots,
        error: null
      } as any)

      const { result } = renderHook(() => useLotManagement())

      const alerts = await result.current.getExpiringLotsAlert(30)

      expect(alerts).toHaveLength(2)
      expect(alerts[0].severity).toBe('high')
      expect(alerts[1].severity).toBe('medium')
    })

    it('should use default threshold of 30 days', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null
      } as any)

      const { result } = renderHook(() => useLotManagement())

      await result.current.getExpiringLotsAlert()

      expect(supabase.rpc).toHaveBeenCalledWith('get_expiring_lots_alert', {
        p_org_id: 'org-123',
        p_days_threshold: 30
      })
    })
  })

  describe('autoAllocateLots', () => {
    it('should allocate multiple lots for required quantity', async () => {
      const mockAllocations = [
        {
          lot_id: 'lot-1',
          lot_number: 'LOT-001',
          allocated_quantity: 60,
          manufacturing_date: '2024-01-01',
          expiration_date: '2025-01-01'
        },
        {
          lot_id: 'lot-2',
          lot_number: 'LOT-002',
          allocated_quantity: 40,
          manufacturing_date: '2024-02-01',
          expiration_date: '2025-02-01'
        }
      ]

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockAllocations,
        error: null
      } as any)

      const { result } = renderHook(() => useLotManagement())

      const allocations = await result.current.autoAllocateLots('product-1', 100)

      expect(allocations).toHaveLength(2)
      expect(allocations[0].allocated_quantity).toBe(60)
      expect(allocations[1].allocated_quantity).toBe(40)
    })

    it('should throw error for insufficient stock', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: new Error('Estoque insuficiente')
      } as any)

      const { result } = renderHook(() => useLotManagement())

      await expect(
        result.current.autoAllocateLots('product-1', 1000)
      ).rejects.toThrow()
    })
  })

  describe('createLot', () => {
    it('should create a new lot successfully', async () => {
      const mockLot = {
        id: 'lot-123',
        lot_number: 'LOT-001',
        product_id: 'product-1',
        quantity: 100
      }

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockLot,
              error: null
            })
          })
        })
      } as any)

      const { result } = renderHook(() => useLotManagement())

      const lot = await result.current.createLot({
        product_id: 'product-1',
        lot_number: 'LOT-001',
        quantity: 100
      })

      expect(lot).toBeDefined()
      expect(lot?.lot_number).toBe('LOT-001')
    })
  })

  describe('requiresLotControl', () => {
    it('should return true for products with lot control', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { has_lot_control: true },
              error: null
            })
          })
        })
      } as any)

      const { result } = renderHook(() => useLotManagement())

      const requires = await result.current.requiresLotControl('product-1')

      expect(requires).toBe(true)
    })

    it('should return false for products without lot control', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { has_lot_control: false },
              error: null
            })
          })
        })
      } as any)

      const { result } = renderHook(() => useLotManagement())

      const requires = await result.current.requiresLotControl('product-1')

      expect(requires).toBe(false)
    })
  })
})
