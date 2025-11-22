/**
 * Skip Links Component
 * Fornece links de atalho para navegação rápida por teclado
 * Conformidade WCAG 2.1 - 2.4.1 Bypass Blocks (Level A)
 */
export const SkipLinks = () => {
  return (
    <nav aria-label="Links de atalho" className="skip-links">
      <a href="#main-content" className="skip-link">
        Pular para conteúdo principal
      </a>
      <a href="#navigation" className="skip-link">
        Pular para navegação
      </a>
      <a href="#search" className="skip-link">
        Pular para busca
      </a>
    </nav>
  );
};
