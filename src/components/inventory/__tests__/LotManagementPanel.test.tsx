import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/utils/renderWithProviders';
import { LotManagementPanel } from '../LotManagementPanel';

vi.mock('@/hooks/useLotManagement', () => ({
  useLotManagement: () => ({
    lots: [],
    loading: false,
    loadLots: vi.fn(),
  }),
}));

describe('LotManagementPanel', () => {
  it('deve renderizar o painel de lotes', () => {
    renderWithProviders(<LotManagementPanel productId="product-123" />);

    expect(screen.getByText(/Gerenciamento de Lotes/)).toBeInTheDocument();
  });

  it('deve mostrar mensagem quando não há lotes', () => {
    renderWithProviders(<LotManagementPanel productId="product-123" />);

    expect(screen.getByText(/Nenhum lote cadastrado/)).toBeInTheDocument();
  });
});
