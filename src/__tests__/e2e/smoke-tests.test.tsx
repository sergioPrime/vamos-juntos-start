import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/utils/renderWithProviders';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Lancamentos from '@/pages/finance/Lancamentos';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    isAuthenticated: true,
    checkPermission: () => true,
  }),
}));

vi.mock('@/hooks/useOrganization', () => ({
  useOrganization: () => ({
    currentOrg: { id: 'org-123', name: 'Test Org' },
    loading: false,
  }),
}));

vi.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: () => ({
    metrics: {
      totalRevenue: 10000,
      totalExpenses: 5000,
      balance: 5000,
    },
    loading: false,
  }),
}));

describe('E2E Smoke Tests', () => {
  it('Dashboard deve carregar sem erros', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('Página de Produtos deve carregar sem erros', () => {
    renderWithProviders(<Products />);
    expect(screen.getByText(/produtos/i)).toBeInTheDocument();
  });

  it('Página de Lançamentos deve carregar sem erros', () => {
    renderWithProviders(<Lancamentos />);
    expect(screen.getByText(/lançamentos/i)).toBeInTheDocument();
  });
});
