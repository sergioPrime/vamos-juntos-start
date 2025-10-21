import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test/utils/renderWithProviders';
import { ActionButton } from '../ActionButton';
import * as usePermissionGuardModule from '@/hooks/usePermissionGuard';

vi.mock('@/hooks/usePermissionGuard');

describe('ActionButton', () => {
  const mockHasPermission = vi.fn();
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePermissionGuardModule.usePermissionGuard).mockReturnValue({
      hasPermission: mockHasPermission,
      hasAllPermissions: vi.fn(),
      hasAnyPermission: vi.fn(),
      hasModuleAccess: vi.fn(),
      getModulePermissions: vi.fn(),
      canPerformAction: vi.fn(),
      accessibleModules: [],
      userPermissions: [],
      loading: false,
    });
  });

  it('should render enabled button when user has permission', () => {
    mockHasPermission.mockReturnValue(true);

    const { getByRole } = renderWithProviders(
      <ActionButton 
        moduleKey="estoque" 
        permission="create"
        onClick={mockOnClick}
      >
        Create Product
      </ActionButton>
    );

    const button = getByRole('button', { name: /create product/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('should render disabled button when user lacks permission', () => {
    mockHasPermission.mockReturnValue(false);

    const { getByRole } = renderWithProviders(
      <ActionButton 
        moduleKey="financeiro" 
        permission="delete"
        onClick={mockOnClick}
      >
        Delete Entry
      </ActionButton>
    );

    const button = getByRole('button', { name: /delete entry/i });
    expect(button).toBeDisabled();
  });
});
