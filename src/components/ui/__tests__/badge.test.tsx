import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test/utils/renderWithProviders';
import { Badge } from '../badge';

describe('Badge', () => {
  it('should render with default variant', () => {
    const { getByText } = renderWithProviders(<Badge>Default Badge</Badge>);
    expect(getByText('Default Badge')).toBeInTheDocument();
  });
});
