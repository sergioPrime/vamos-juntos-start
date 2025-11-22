import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/renderWithProviders';
import { PasswordStrengthIndicator } from '../PasswordStrengthIndicator';

describe('PasswordStrengthIndicator', () => {
  it('should not render when password is empty', () => {
    renderWithProviders(<PasswordStrengthIndicator password="" />);
    expect(screen.queryByText(/força da senha/i)).not.toBeInTheDocument();
  });

  it('should show weak password indicator', () => {
    renderWithProviders(<PasswordStrengthIndicator password="weak" />);
    expect(screen.getByText(/fraca/i)).toBeInTheDocument();
  });

  it('should show medium password indicator', () => {
    renderWithProviders(<PasswordStrengthIndicator password="Medium1!" />);
    expect(screen.getByText(/média/i)).toBeInTheDocument();
  });

  it('should show strong password indicator', () => {
    renderWithProviders(<PasswordStrengthIndicator password="StrongPass123!@#" />);
    expect(screen.getByText(/forte/i)).toBeInTheDocument();
  });

  it('should display validation errors for weak password', () => {
    renderWithProviders(<PasswordStrengthIndicator password="weak" />);
    expect(screen.getByText(/pelo menos 8 caracteres/i)).toBeInTheDocument();
  });

  it('should not display errors for strong password', () => {
    renderWithProviders(<PasswordStrengthIndicator password="StrongPass123!@#" />);
    expect(screen.queryByText(/pelo menos 8 caracteres/i)).not.toBeInTheDocument();
  });

  it('should have proper color coding for weak password', () => {
    const { container } = renderWithProviders(<PasswordStrengthIndicator password="weak" />);
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveClass('bg-destructive');
  });

  it('should have proper color coding for medium password', () => {
    const { container } = renderWithProviders(<PasswordStrengthIndicator password="Medium1!" />);
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveClass('bg-warning');
  });

  it('should have proper color coding for strong password', () => {
    const { container } = renderWithProviders(<PasswordStrengthIndicator password="StrongPass123!@#" />);
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveClass('bg-success');
  });

  it('should have proper ARIA attributes', () => {
    const { container } = renderWithProviders(<PasswordStrengthIndicator password="Medium1!" />);
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute('aria-label');
    expect(progressBar).toHaveAttribute('aria-valuenow');
  });

  it('should update when password changes', () => {
    const { rerender } = renderWithProviders(<PasswordStrengthIndicator password="weak" />);
    expect(screen.getByText(/fraca/i)).toBeInTheDocument();

    rerender(<PasswordStrengthIndicator password="StrongPass123!@#" />);
    expect(screen.getByText(/forte/i)).toBeInTheDocument();
  });
});
