import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test/utils/renderWithProviders';
import { PermissionGate } from '../PermissionGate';
import * as useModulePermissionsModule from '@/hooks/useModulePermissions';

vi.mock('@/hooks/useModulePermissions');

describe('PermissionGate', () => {
  const mockHasPermission = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useModulePermissionsModule.useModulePermissions).mockReturnValue({
      permissions: [],
      hasPermission: mockHasPermission,
      canCreate: vi.fn(),
      canRead: vi.fn(),
      canUpdate: vi.fn(),
      canDelete: vi.fn(),
      refresh: vi.fn(),
      loading: false,
    });
  });

  it('should render children when user has permission', () => {
    mockHasPermission.mockReturnValue(true);

    const { getByText } = renderWithProviders(
      <PermissionGate moduleKey="financeiro" permission="read">
        <div>Protected Content</div>
      </PermissionGate>
    );

    expect(getByText('Protected Content')).toBeInTheDocument();
  });

  it('should not render children when user lacks permission', () => {
    mockHasPermission.mockReturnValue(false);

    const { queryByText } = renderWithProviders(
      <PermissionGate moduleKey="vendas" permission="delete">
        <div>Protected Content</div>
      </PermissionGate>
    );

    expect(queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
