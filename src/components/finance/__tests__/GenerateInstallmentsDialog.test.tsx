import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/utils/renderWithProviders';
import { GenerateInstallmentsDialog } from '../GenerateInstallmentsDialog';

vi.mock('@/hooks/useInstallments', () => ({
  useInstallments: () => ({
    generateInstallments: vi.fn().mockResolvedValue(true),
    loading: false,
  }),
}));

describe('GenerateInstallmentsDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o dialog quando aberto', () => {
    renderWithProviders(
      <GenerateInstallmentsDialog
        entryId="entry-123"
        totalAmount={1000}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Gerar Parcelas')).toBeInTheDocument();
    expect(screen.getByText(/R\$ 1\.000,00/)).toBeInTheDocument();
  });

  it('deve permitir alterar número de parcelas', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <GenerateInstallmentsDialog
        entryId="entry-123"
        totalAmount={1200}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );

    const input = screen.getByLabelText('Número de Parcelas');
    await user.clear(input);
    await user.type(input, '3');

    expect(screen.getByText(/3x de R\$ 400,00/)).toBeInTheDocument();
  });

  it('deve calcular valor da parcela corretamente', () => {
    renderWithProviders(
      <GenerateInstallmentsDialog
        entryId="entry-123"
        totalAmount={900}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText(/1x de R\$ 900,00/)).toBeInTheDocument();
  });
});
