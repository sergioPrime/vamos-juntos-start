import { useEffect, useState } from 'react'

/**
 * Hook para debounce de valores
 * Útil para otimizar buscas e filtros
 * 
 * @param value - Valor a ser debounced
 * @param delay - Delay em ms (padrão: 500ms)
 * @returns Valor debounced
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Cria timer para atualizar valor após delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Limpa timer se value mudar antes do delay
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para debounce de callbacks
 * Útil para otimizar chamadas de API
 * 
 * @param callback - Função a ser executada
 * @param delay - Delay em ms (padrão: 500ms)
 * @returns Função debounced
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>()

  useEffect(() => {
    // Limpa timeout quando componente desmonta
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  return (...args: Parameters<T>) => {
    // Limpa timeout anterior
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Cria novo timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args)
    }, delay)

    setTimeoutId(newTimeoutId)
  }
}
