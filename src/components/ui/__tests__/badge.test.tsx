import { describe, it, expect } from 'vitest';
import { screen, renderWithProviders } from '@/test/utils/renderWithProviders';
import { Badge } from '../badge';

describe('Badge', () => {
  it('should render with default variant', () => {
    renderWithProviders(<Badge>Default Badge</Badge>);
    expect(screen.getByText('Default Badge')).toBeInTheDocument();
  });
});
