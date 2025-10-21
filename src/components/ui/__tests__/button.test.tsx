import { describe, it, expect, vi } from 'vitest';
import { screen, renderWithProviders, userEvent } from '@/test/utils/renderWithProviders';
import { Button } from '../button';

describe('Button', () => {
  it('should render with default variant', () => {
    renderWithProviders(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    renderWithProviders(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
