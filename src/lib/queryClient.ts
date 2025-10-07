import { QueryClient } from '@tanstack/react-query'

/**
 * Configuração global do React Query
 * Implementa cache inteligente para melhor performance
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos
      staleTime: 5 * 60 * 1000,
      
      // Mantém em cache por 10 minutos
      gcTime: 10 * 60 * 1000,
      
      // Retry automático em caso de erro
      retry: 1,
      
      // Refetch em segundo plano quando a janela volta ao foco
      refetchOnWindowFocus: false,
      
      // Refetch ao reconectar à internet
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry automático para mutations
      retry: 1,
    },
  },
})
