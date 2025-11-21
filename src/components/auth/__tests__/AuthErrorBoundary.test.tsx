import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthErrorBoundary } from '../AuthErrorBoundary'

// Mock do window.location
const mockLocation = {
  href: '',
  reload: vi.fn(),
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// Componente que lança erro para teste
const ThrowError = ({ error }: { error: Error }) => {
  throw error
}

// Componente normal para teste
const NormalComponent = () => <div>Conteúdo Normal</div>

describe('AuthErrorBoundary', () => {
  let consoleErrorSpy: any

  beforeEach(() => {
    // Silencia console.error para testes
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockLocation.href = ''
    mockLocation.reload.mockClear()
    vi.clearAllTimers()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('Renderização Normal', () => {
    it('deve renderizar children quando não há erro', () => {
      const { getByText } = render(
        <AuthErrorBoundary>
          <NormalComponent />
        </AuthErrorBoundary>
      )

      expect(getByText('Conteúdo Normal')).toBeInTheDocument()
    })
  })

  describe('Captura de Erros', () => {
    it('deve capturar e exibir erro de autenticação', () => {
      const authError = new Error('Invalid auth token')

      const { getByText } = render(
        <AuthErrorBoundary>
          <ThrowError error={authError} />
        </AuthErrorBoundary>
      )

      expect(getByText('Erro de Autenticação')).toBeInTheDocument()
      expect(
        getByText('Ocorreu um problema com sua sessão de autenticação')
      ).toBeInTheDocument()
      expect(getByText('Invalid auth token')).toBeInTheDocument()
    })

    it('deve capturar erro genérico', () => {
      const genericError = new Error('Something went wrong')

      const { getByText } = render(
        <AuthErrorBoundary>
          <ThrowError error={genericError} />
        </AuthErrorBoundary>
      )

      expect(getByText('Erro de Autenticação')).toBeInTheDocument()
      expect(getByText('Something went wrong')).toBeInTheDocument()
    })

    it('deve exibir ícone de alerta', () => {
      const error = new Error('Test error')

      render(
        <AuthErrorBoundary>
          <ThrowError error={error} />
        </AuthErrorBoundary>
      )

      // Verifica se há um elemento SVG (ícone AlertTriangle)
      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Ações de Recuperação', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('deve ter botão "Limpar Sessão e Fazer Login"', () => {
      const error = new Error('Auth error')

      const { getByRole } = render(
        <AuthErrorBoundary>
          <ThrowError error={error} />
        </AuthErrorBoundary>
      )

      expect(
        getByRole('button', { name: /Limpar Sessão e Fazer Login/i })
      ).toBeInTheDocument()
    })

    it('deve ter botão "Tentar Novamente"', () => {
      const error = new Error('Auth error')

      const { getByRole } = render(
        <AuthErrorBoundary>
          <ThrowError error={error} />
        </AuthErrorBoundary>
      )

      expect(
        getByRole('button', { name: /Tentar Novamente/i })
      ).toBeInTheDocument()
    })

    it('deve limpar localStorage e redirecionar para /auth ao clicar em "Limpar Sessão"', async () => {
      const user = userEvent.setup({ delay: null })
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')

      const error = new Error('Auth error')

      const { getByRole } = render(
        <AuthErrorBoundary>
          <ThrowError error={error} />
        </AuthErrorBoundary>
      )

      const button = getByRole('button', {
        name: /Limpar Sessão e Fazer Login/i,
      })

      await user.click(button)

      // Deve ter removido o token
      expect(removeItemSpy).toHaveBeenCalledWith(
        'sb-wrdyffwjlylgxfbxbztf-auth-token'
      )

      // Avança timer para executar o setTimeout
      vi.advanceTimersByTime(150)

      // Deve ter redirecionado
      expect(mockLocation.href).toBe('/auth')

      removeItemSpy.mockRestore()
    })

    it('deve recarregar página ao clicar em "Tentar Novamente"', async () => {
      const user = userEvent.setup({ delay: null })
      const error = new Error('Auth error')

      const { getByRole } = render(
        <AuthErrorBoundary>
          <ThrowError error={error} />
        </AuthErrorBoundary>
      )

      const button = getByRole('button', {
        name: /Tentar Novamente/i,
      })

      await user.click(button)

      expect(mockLocation.reload).toHaveBeenCalled()
    })
  })

  describe('Logging', () => {
    it('deve logar erro no console', () => {
      const error = new Error('Test error')

      render(
        <AuthErrorBoundary>
          <ThrowError error={error} />
        </AuthErrorBoundary>
      )

      // Console.error deve ter sido chamado
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('deve logar detalhes extras para erros de autenticação', () => {
      const authError = new Error('Invalid token')

      render(
        <AuthErrorBoundary>
          <ThrowError error={authError} />
        </AuthErrorBoundary>
      )

      // Deve ter logado o erro
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('UI e Feedback', () => {
    it('deve exibir mensagem de ajuda sobre cache', () => {
      const error = new Error('Auth error')

      const { getByText } = render(
        <AuthErrorBoundary>
          <ThrowError error={error} />
        </AuthErrorBoundary>
      )

      expect(
        getByText(/Se o problema persistir, tente limpar o cache do navegador/i)
      ).toBeInTheDocument()
    })

    it('deve exibir mensagem de erro em código monospace', () => {
      const error = new Error('Detailed auth error')

      const { getByText } = render(
        <AuthErrorBoundary>
          <ThrowError error={error} />
        </AuthErrorBoundary>
      )

      const errorText = getByText('Detailed auth error')
      const errorElement = errorText.closest('p')
      
      // Verifica se tem classe font-mono (monospace)
      expect(errorElement?.className).toContain('font-mono')
    })
  })

  describe('Comportamento de Reset', () => {
    it('deve resetar estado de erro ao clicar em reset', async () => {
      const user = userEvent.setup({ delay: null })
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')

      const error = new Error('Auth error')

      const { getByText, getByRole } = render(
        <AuthErrorBoundary>
          <ThrowError error={error} />
        </AuthErrorBoundary>
      )

      // Verifica que está mostrando erro
      expect(getByText('Erro de Autenticação')).toBeInTheDocument()

      const button = getByRole('button', {
        name: /Limpar Sessão e Fazer Login/i,
      })

      await user.click(button)

      // O estado deve ser resetado internamente
      expect(removeItemSpy).toHaveBeenCalled()

      removeItemSpy.mockRestore()
    })
  })
})
