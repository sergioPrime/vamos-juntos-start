/**
 * Screen Reader Only Component
 * Conteúdo visível apenas para leitores de tela
 * Conformidade WCAG 2.1 - 1.1.1 Non-text Content (Level A)
 */
export const SrOnly = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
};
