import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/renderWithProviders';
import { Button } from '../button';

describe('Button', () => {
  it('should render with default variant', () => {
    const { getByRole } = renderWithProviders(<Button>Click me</Button>);
    const button = getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    const { getByRole } = renderWithProviders(<Button onClick={handleClick}>Click me</Button>);
    await user.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
