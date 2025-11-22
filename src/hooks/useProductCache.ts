import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from './useOrganization'

export interface CachedProduct {
  id: string
  name: string
  sku: string | null
  stock_quantity: number
  min_stock_level: number | null
  active: boolean
  has_lot_control: boolean
  has_serial_control: boolean
}

/**
 * Hook para cache inteligente de produtos
 * - Cache de 5 minutos para produtos frequentes
 * - Invalidação manual disponível
 * - Pré-fetch de produtos relacionados
 */
export function useProductCache() {
  const { currentOrg } = useOrganization()
  const queryClient = useQueryClient()

  // Cache de todos os produtos ativos
  const { data: products, isLoading } = useQuery({
    queryKey: ['products-cache', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return []

      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity, min_stock_level, active, has_lot_control, has_serial_control')
        .eq('org_id', currentOrg.id)
        .eq('active', true)
        .order('name')

      if (error) throw error
      return (data || []) as CachedProduct[]
    },
    enabled: !!currentOrg?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })

  // Busca produto por ID (usa cache se disponível)
  const getProductById = (productId: string): CachedProduct | undefined => {
    return products?.find(p => p.id === productId)
  }

  // Busca produto por SKU (usa cache se disponível)
  const getProductBySku = (sku: string): CachedProduct | undefined => {
    return products?.find(p => p.sku?.toLowerCase() === sku.toLowerCase())
  }

  // Busca produtos por IDs (batch)
  const getProductsByIds = (productIds: string[]): CachedProduct[] => {
    if (!products) return []
    return products.filter(p => productIds.includes(p.id))
  }

  // Invalida cache de produtos
  const invalidateCache = () => {
    queryClient.invalidateQueries({ queryKey: ['products-cache', currentOrg?.id] })
  }

  // Atualiza produto específico no cache
  const updateProductInCache = (productId: string, updates: Partial<CachedProduct>) => {
    queryClient.setQueryData(
      ['products-cache', currentOrg?.id],
      (old: CachedProduct[] | undefined) => {
        if (!old) return old
        return old.map(p => p.id === productId ? { ...p, ...updates } : p)
      }
    )
  }

  // Pré-carrega produto específico
  const prefetchProduct = async (productId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['product', productId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()

        if (error) throw error
        return data
      },
      staleTime: 5 * 60 * 1000,
    })
  }

  return {
    products: products || [],
    isLoading,
    getProductById,
    getProductBySku,
    getProductsByIds,
    invalidateCache,
    updateProductInCache,
    prefetchProduct,
  }
}
