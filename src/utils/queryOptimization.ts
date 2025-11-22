/**
 * Utilitários para otimização de queries do Supabase
 */

import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Cria índice para busca full-text (deve ser executado no DB)
 * Exemplo: CREATE INDEX products_search_idx ON products USING GIN (to_tsvector('portuguese', name || ' ' || COALESCE(sku, '')));
 */

/**
 * Otimiza select para buscar apenas campos necessários
 */
export function optimizedSelect(fields: string[]): string {
  return fields.join(', ')
}

/**
 * Batch de queries para reduzir round-trips
 */
export async function batchQueries<T>(
  queries: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(queries.map(q => q()))
}

/**
 * Query com timeout para evitar consultas longas
 */
export async function queryWithTimeout<T>(
  queryFn: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  return Promise.race([
    queryFn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    )
  ])
}

/**
 * Agrega múltiplas condições OR de forma eficiente
 */
export function buildOrConditions(
  conditions: Array<{ column: string; value: any }>
): string {
  return conditions.map(c => `${c.column}.eq.${c.value}`).join(',')
}

/**
 * Cria filtro de busca otimizado
 */
export function createSearchFilter(searchTerm: string, columns: string[]): any {
  if (!searchTerm.trim()) return {}
  
  const term = searchTerm.toLowerCase()
  return {
    or: columns.map(col => `${col}.ilike.%${term}%`).join(',')
  }
}

/**
 * Limita quantidade de registros retornados
 */
export const QUERY_LIMITS = {
  SMALL: 10,
  MEDIUM: 50,
  LARGE: 100,
  XLARGE: 500,
} as const

/**
 * Configurações de cache recomendadas
 */
export const CACHE_TIMES = {
  REALTIME: 0,                    // Sem cache
  FAST: 30 * 1000,                // 30 segundos
  NORMAL: 2 * 60 * 1000,          // 2 minutos
  SLOW: 5 * 60 * 1000,            // 5 minutos
  VERY_SLOW: 15 * 60 * 1000,      // 15 minutos
  STATIC: 60 * 60 * 1000,         // 1 hora
} as const

/**
 * Determina tempo de cache baseado na frequência de atualização
 */
export function getCacheTime(updateFrequency: 'realtime' | 'fast' | 'normal' | 'slow' | 'static'): number {
  const map = {
    realtime: CACHE_TIMES.REALTIME,
    fast: CACHE_TIMES.FAST,
    normal: CACHE_TIMES.NORMAL,
    slow: CACHE_TIMES.SLOW,
    static: CACHE_TIMES.STATIC,
  }
  return map[updateFrequency]
}

/**
 * Otimiza query de contagem usando estimate quando possível
 */
export async function optimizedCount(
  supabase: SupabaseClient,
  table: string,
  filters?: Record<string, any>
): Promise<number> {
  let query = supabase
    .from(table)
    .select('*', { count: 'exact', head: true })

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value)
      }
    })
  }

  const { count, error } = await query

  if (error) throw error
  return count || 0
}

/**
 * Cria query com joins otimizados
 */
export function optimizedJoin(
  mainTable: string,
  joinTable: string,
  selectFields: {
    main: string[]
    joined: string[]
  }
): string {
  const mainFields = selectFields.main.join(', ')
  const joinedFields = selectFields.joined.map(f => `${joinTable}:${f}`).join(', ')
  
  return `${mainFields}, ${joinedFields}`
}

/**
 * Estratégias de prefetch baseadas em padrões de uso
 */
export const PREFETCH_STRATEGIES = {
  // Produtos relacionados quando ver um produto
  RELATED_PRODUCTS: (productId: string) => ({
    queryKey: ['related-products', productId],
    staleTime: CACHE_TIMES.SLOW,
  }),
  
  // Próxima página quando navegar
  NEXT_PAGE: (page: number, table: string) => ({
    queryKey: [table, 'page', page + 1],
    staleTime: CACHE_TIMES.NORMAL,
  }),
  
  // Detalhes quando hover em lista
  ITEM_DETAILS: (id: string, table: string) => ({
    queryKey: [table, 'details', id],
    staleTime: CACHE_TIMES.NORMAL,
  }),
}

/**
 * Monitora performance de queries
 */
export function measureQueryTime<T>(
  queryFn: () => Promise<T>,
  label: string
): Promise<T> {
  const start = performance.now()
  
  return queryFn().finally(() => {
    const duration = performance.now() - start
    if (duration > 1000) {
      console.warn(`Slow query [${label}]: ${duration.toFixed(2)}ms`)
    } else {
      console.debug(`Query [${label}]: ${duration.toFixed(2)}ms`)
    }
  })
}
