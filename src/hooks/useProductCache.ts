import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

/**
 * Interface para produtos cacheados
 */
export interface CachedProduct {
  id: string
  name: string
  sku: string | null
  category: string | null
  unit: string
  stock_quantity: number
  min_stock_level: number
  cost_price: number
  unit_price: number
  active: boolean
}

/**
 * Hook para cache inteligente de produtos
 * Reduz queries ao banco de dados usando React Query
 * 
 * Configuração de cache:
 * - staleTime: 5 minutos (dados considerados frescos)
 * - gcTime: 10 minutos (dados mantidos em memória)
 * 
 * @example
 * const { data: products, isLoading } = useProductCache.getAll(orgId)
 */
export const useProductCache = {
  /**
   * Busca todos os produtos ativos de uma organização
   */
  getAll: (orgId: string) => {
    return useQuery({
      queryKey: ['products-cache', orgId],
      queryFn: async () => {
        if (!orgId) return []

        const { data, error } = await supabase
          .from('products')
          .select('id, name, sku, category, unit, stock_quantity, min_stock_level, cost_price, unit_price, active')
          .eq('org_id', orgId)
          .eq('active', true)
          .order('name')

        if (error) throw error
        return data as CachedProduct[]
      },
      enabled: !!orgId,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
    })
  },

  /**
   * Busca um produto específico por ID
   */
  getById: (productId: string, orgId: string) => {
    return useQuery({
      queryKey: ['product-cache', productId],
      queryFn: async () => {
        if (!productId || !orgId) return null

        const { data, error } = await supabase
          .from('products')
          .select('id, name, sku, category, unit, stock_quantity, min_stock_level, cost_price, unit_price, active')
          .eq('id', productId)
          .eq('org_id', orgId)
          .single()

        if (error) throw error
        return data as CachedProduct
      },
      enabled: !!productId && !!orgId,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    })
  },

  /**
   * Busca um produto por SKU
   */
  getBySku: (sku: string, orgId: string) => {
    return useQuery({
      queryKey: ['product-cache-sku', sku, orgId],
      queryFn: async () => {
        if (!sku || !orgId) return null

        const { data, error } = await supabase
          .from('products')
          .select('id, name, sku, category, unit, stock_quantity, min_stock_level, cost_price, unit_price, active')
          .eq('sku', sku)
          .eq('org_id', orgId)
          .eq('active', true)
          .single()

        if (error) throw error
        return data as CachedProduct
      },
      enabled: !!sku && !!orgId,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    })
  },

  /**
   * Busca múltiplos produtos por IDs
   */
  getByIds: (productIds: string[], orgId: string) => {
    return useQuery({
      queryKey: ['products-cache-bulk', productIds.sort().join(','), orgId],
      queryFn: async () => {
        if (!productIds.length || !orgId) return []

        const { data, error } = await supabase
          .from('products')
          .select('id, name, sku, category, unit, stock_quantity, min_stock_level, cost_price, unit_price, active')
          .in('id', productIds)
          .eq('org_id', orgId)

        if (error) throw error
        return data as CachedProduct[]
      },
      enabled: productIds.length > 0 && !!orgId,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    })
  },
}

/**
 * Hook para manipular o cache de produtos
 * Útil para invalidar ou atualizar o cache manualmente
 */
export function useProductCacheManager() {
  const queryClient = useQueryClient()

  return {
    /**
     * Invalida todo o cache de produtos
     * Força uma nova busca na próxima query
     */
    invalidateAll: (orgId?: string) => {
      if (orgId) {
        queryClient.invalidateQueries({ queryKey: ['products-cache', orgId] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['products-cache'] })
      }
    },

    /**
     * Invalida o cache de um produto específico
     */
    invalidateProduct: (productId: string) => {
      queryClient.invalidateQueries({ queryKey: ['product-cache', productId] })
    },

    /**
     * Atualiza um produto no cache sem fazer nova query
     */
    updateProduct: (productId: string, orgId: string, updatedData: Partial<CachedProduct>) => {
      queryClient.setQueryData(['product-cache', productId], (old: CachedProduct | undefined) => {
        if (!old) return old
        return { ...old, ...updatedData }
      })

      // Também atualizar na lista geral
      queryClient.setQueryData(['products-cache', orgId], (old: CachedProduct[] | undefined) => {
        if (!old) return old
        return old.map(product => 
          product.id === productId ? { ...product, ...updatedData } : product
        )
      })
    },

    /**
     * Faz prefetch de um produto
     * Útil para carregar dados antes que o usuário precise
     */
    prefetchProduct: async (productId: string, orgId: string) => {
      await queryClient.prefetchQuery({
        queryKey: ['product-cache', productId],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('products')
            .select('id, name, sku, category, unit, stock_quantity, min_stock_level, cost_price, unit_price, active')
            .eq('id', productId)
            .eq('org_id', orgId)
            .single()

          if (error) throw error
          return data as CachedProduct
        },
        staleTime: 5 * 60 * 1000,
      })
    },
  }
}
