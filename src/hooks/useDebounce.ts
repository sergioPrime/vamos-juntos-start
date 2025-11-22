import { useState, useEffect } from 'react'

/**
 * Hook que debounce (atrasa) a atualização de um valor
 * Útil para evitar queries excessivas em campos de busca
 * 
 * @param value - Valor a ser debouncado
 * @param delay - Delay em milissegundos (padrão: 500ms)
 * @returns Valor debouncado
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebounce(searchTerm, 500)
 * 
 * // debouncedSearch só atualiza 500ms após a última mudança em searchTerm
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Criar um timeout que atualiza o valor após o delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Limpar o timeout se o valor mudar antes do delay acabar
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook que debounce uma função callback
 * Útil para debounce de funções em vez de valores
 * 
 * @param callback - Função a ser debouncada
 * @param delay - Delay em milissegundos (padrão: 500ms)
 * @returns Função debouncada
 * 
 * @example
 * const debouncedFetch = useDebouncedCallback((term: string) => {
 *   fetchData(term)
 * }, 500)
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args)
    }, delay)

    setTimeoutId(newTimeoutId)
  }
}
