import { useCallback } from 'react';

/**
 * Hook para anunciar mensagens para leitores de tela
 * Conformidade WCAG 2.1 - 4.1.3 Status Messages (Level AA)
 * 
 * @example
 * const { announce } = useAnnouncer();
 * announce('Produto salvo com sucesso');
 */
export const useAnnouncer = () => {
  const announce = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    const announcer = document.getElementById('aria-announcer');
    
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;
      
      // Limpar após 1 segundo
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }, []);

  return { announce };
};
