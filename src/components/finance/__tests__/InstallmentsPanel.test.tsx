import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/utils/renderWithProviders';
import { InstallmentsPanel } from '../InstallmentsPanel';

const mockInstallments = [
  {
    id: '1',
    installment_number: 1,
    total_installments: 3,
    amount: 100,
    due_date: '2025-02-01',
    is_settled: false,
  },
  {
    id: '2',
    installment_number: 2,
    total_installments: 3,
    amount: 100,
    due_date: '2025-03-01',
    is_settled: true,
    settled_at: '2025-02-28',
  },
];

vi.mock('@/hooks/useInstallments', () => ({
  useInstallments: () => ({
    installments: mockInstallments,
    loading: false,
    loadInstallments: vi.fn(),
    unsettleInstallment: vi.fn().mockResolvedValue(true),
  }),
}));

describe('InstallmentsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar lista de parcelas', async () => {
    renderWithProviders(<InstallmentsPanel entryId="entry-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Parcela 1\/3/)).toBeInTheDocument();
      expect(screen.getByText(/Parcela 2\/3/)).toBeInTheDocument();
    });
  });

  it('deve mostrar status de parcela quitada', async () => {
    renderWithProviders(<InstallmentsPanel entryId="entry-123" />);

    await waitFor(() => {
      expect(screen.getByText('Quitada')).toBeInTheDocument();
    });
  });

  it('deve mostrar status de parcela pendente', async () => {
    renderWithProviders(<InstallmentsPanel entryId="entry-123" />);

    await waitFor(() => {
      expect(screen.getByText('Pendente')).toBeInTheDocument();
    });
  });

  it('deve renderizar mensagem quando não há parcelas', () => {
    vi.mock('@/hooks/useInstallments', () => ({
      useInstallments: () => ({
        installments: [],
        loading: false,
        loadInstallments: vi.fn(),
      }),
    }));

    renderWithProviders(<InstallmentsPanel entryId="entry-123" />);

    expect(screen.getByText(/Nenhuma parcela encontrada/)).toBeInTheDocument();
  });
});
