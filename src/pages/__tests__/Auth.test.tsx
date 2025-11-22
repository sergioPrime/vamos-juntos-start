import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor, userEvent } from '@/test/utils/renderWithProviders';
import Auth from '../Auth';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Auth Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sign In', () => {
    it('should render sign in form', () => {
      renderWithProviders(<Auth />);
      
      expect(screen.getByRole('tab', { name: /entrar/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });

    it('should handle successful sign in', async () => {
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: { id: '123' }, session: { access_token: 'token' } },
        error: null,
      } as any);

      renderWithProviders(<Auth />);

      await user.type(screen.getByLabelText(/e-mail/i), 'test@example.com');
      await user.type(screen.getByLabelText(/senha/i), 'password123');
      await user.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/pdv');
      });
    });

    it('should handle sign in error', async () => {
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      } as any);

      renderWithProviders(<Auth />);

      await user.type(screen.getByLabelText(/e-mail/i), 'test@example.com');
      await user.type(screen.getByLabelText(/senha/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during sign in', async () => {
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithPassword).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderWithProviders(<Auth />);

      await user.type(screen.getByLabelText(/e-mail/i), 'test@example.com');
      await user.type(screen.getByLabelText(/senha/i), 'password123');
      await user.click(screen.getByRole('button', { name: /entrar/i }));

      expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled();
    });
  });

  describe('Sign Up', () => {
    it('should render sign up form when clicking cadastrar tab', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Auth />);

      await user.click(screen.getByRole('tab', { name: /cadastrar/i }));

      expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
    });

    it('should show password strength indicator on sign up', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Auth />);

      await user.click(screen.getByRole('tab', { name: /cadastrar/i }));
      const passwordInputs = screen.getAllByLabelText(/senha/i);
      await user.type(passwordInputs[0], 'weak');

      expect(screen.getByText(/força da senha/i)).toBeInTheDocument();
    });

    it('should validate password strength on sign up', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Auth />);

      await user.click(screen.getByRole('tab', { name: /cadastrar/i }));
      
      await user.type(screen.getByLabelText(/e-mail/i), 'newuser@example.com');
      const passwordInputs = screen.getAllByLabelText(/senha/i);
      await user.type(passwordInputs[0], 'weak');
      await user.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(screen.getByText(/senha deve ter/i)).toBeInTheDocument();
      });
    });

    it('should handle successful sign up', async () => {
      const user = userEvent.setup();
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true },
        error: null,
      } as any);
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: { id: '123' }, session: { access_token: 'token' } },
        error: null,
      } as any);

      renderWithProviders(<Auth />);

      await user.click(screen.getByRole('tab', { name: /cadastrar/i }));
      await user.type(screen.getByLabelText(/e-mail/i), 'newuser@example.com');
      const passwordInputs = screen.getAllByLabelText(/senha/i);
      await user.type(passwordInputs[0], 'StrongPass123!@#');
      await user.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(supabase.functions.invoke).toHaveBeenCalledWith('create-user', {
          body: { email: 'newuser@example.com', password: 'StrongPass123!@#' },
        });
        expect(mockNavigate).toHaveBeenCalledWith('/planos-novos-usuarios');
      });
    });

    it('should handle sign up error', async () => {
      const user = userEvent.setup();
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'User already exists' },
      } as any);

      renderWithProviders(<Auth />);

      await user.click(screen.getByRole('tab', { name: /cadastrar/i }));
      await user.type(screen.getByLabelText(/e-mail/i), 'existing@example.com');
      const passwordInputs = screen.getAllByLabelText(/senha/i);
      await user.type(passwordInputs[0], 'StrongPass123!@#');
      await user.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(screen.getByText(/user already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(<Auth />);

      expect(screen.getByLabelText(/e-mail/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/senha/i)).toHaveAttribute('type', 'password');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Auth />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /entrar/i });

      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      } as any);

      renderWithProviders(<Auth />);

      await user.type(screen.getByLabelText(/e-mail/i), 'test@example.com');
      await user.type(screen.getByLabelText(/senha/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        const errorMessage = screen.getByText(/invalid credentials/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Form Validation', () => {
    it('should require email field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Auth />);

      await user.click(screen.getByRole('button', { name: /entrar/i }));

      const emailInput = screen.getByLabelText(/e-mail/i);
      expect(emailInput).toBeRequired();
    });

    it('should require password field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Auth />);

      await user.click(screen.getByRole('button', { name: /entrar/i }));

      const passwordInput = screen.getByLabelText(/senha/i);
      expect(passwordInput).toBeRequired();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Auth />);

      const emailInput = screen.getByLabelText(/e-mail/i);
      await user.type(emailInput, 'invalid-email');

      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });
});
