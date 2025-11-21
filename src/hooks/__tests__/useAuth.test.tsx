import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../useAuth'
import { ReactNode } from 'react'

// Mock do toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock do Supabase client
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(),
  },
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}))

// Wrapper para testes
const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

// Helper waitFor customizado
const waitFor = async (callback: () => void, timeout = 3000) => {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    try {
      callback()
      return
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }
  callback() // Última tentativa que vai falhar se necessário
}

// Mock de sessão válida
const mockValidSession = {
  access_token: 'valid-access-token',
  refresh_token: 'valid-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: {
    id: 'user-123',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// Mock de erro de refresh token
const mockRefreshTokenError = {
  message: 'Invalid Refresh Token: Refresh Token Not Found',
  status: 400,
  code: 'refresh_token_not_found',
  name: 'AuthApiError',
}

describe('useAuth', () => {
  let localStorageMock: { [key: string]: string }

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Mock localStorage
    localStorageMock = {}
    Storage.prototype.getItem = vi.fn((key) => localStorageMock[key] || null)
    Storage.prototype.setItem = vi.fn((key, value) => {
      localStorageMock[key] = value
    })
    Storage.prototype.removeItem = vi.fn((key) => {
      delete localStorageMock[key]
    })

    // Setup default mock behavior
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Inicialização', () => {
    it('deve iniciar com loading true', () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.loading).toBe(true)
    })

    it('deve carregar sessão válida com sucesso', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockValidSession },
        error: null,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(mockValidSession.user)
      expect(result.current.session).toEqual(mockValidSession)
    })

    it('deve definir user e session como null quando não há sessão', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })
  })

  describe('Tratamento de Erro de Refresh Token', () => {
    it('deve detectar erro de refresh token e limpar sessão corrompida', async () => {
      // Simula erro de refresh token
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: mockRefreshTokenError,
      })

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Deve ter limpado a sessão
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()

      // Deve ter tentado limpar o localStorage
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        'sb-wrdyffwjlylgxfbxbztf-auth-token'
      )

      // Deve ter chamado signOut com scope local
      expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
    })

    it('deve identificar erro com mensagem "refresh_token"', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: {
          message: 'Error with refresh_token',
          status: 400,
        },
      })

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(localStorage.removeItem).toHaveBeenCalled()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('deve identificar erro com código refresh_token_not_found', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: {
          code: 'refresh_token_not_found',
          message: 'Token not found',
          status: 400,
        },
      })

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(localStorage.removeItem).toHaveBeenCalled()
    })
  })

  describe('Retry Logic', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('deve fazer retry até 3 vezes em caso de erro não relacionado a refresh token', async () => {
      let callCount = 0
      
      mockSupabase.auth.getSession.mockImplementation(() => {
        callCount++
        if (callCount <= 3) {
          return Promise.resolve({
            data: { session: null },
            error: { message: 'Network error', status: 500 },
          })
        }
        return Promise.resolve({
          data: { session: mockValidSession },
          error: null,
        })
      })

      const { result, rerender } = renderHook(() => useAuth(), { wrapper })

      // Primeira tentativa
      await act(async () => {
        await vi.runAllTimersAsync()
      })
      expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(1)

      // Avança timer para 1 segundo (primeira retry)
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      rerender()

      await act(async () => {
        await vi.runAllTimersAsync()
      })
      expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(2)
    })

    it('não deve fazer retry se for erro de refresh token', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: mockRefreshTokenError,
      })

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      // Avança timers
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      // Deve ter chamado apenas uma vez (sem retry)
      expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(1)
    })
  })

  describe('signOut', () => {
    it('deve fazer logout com sucesso', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockValidSession },
        error: null,
      })

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeTruthy()
      })

      await act(async () => {
        await result.current.signOut()
      })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
        expect(result.current.session).toBeNull()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('deve limpar sessão mesmo se signOut falhar com erro de refresh token', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockValidSession },
        error: null,
      })

      mockSupabase.auth.signOut.mockResolvedValue({
        error: mockRefreshTokenError,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeTruthy()
      })

      await act(async () => {
        await result.current.signOut()
      })

      // Deve ter limpado o estado local mesmo com erro
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()

      // Deve ter tentado limpar sessão corrompida
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        'sb-wrdyffwjlylgxfbxbztf-auth-token'
      )
    })

    it('deve limpar sessão mesmo se signOut lançar exception', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockValidSession },
        error: null,
      })

      mockSupabase.auth.signOut.mockRejectedValue(
        new Error('Critical error')
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeTruthy()
      })

      await act(async () => {
        await result.current.signOut()
      })

      // Deve ter limpado o estado local mesmo com exception
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()

      // Deve ter tentado limpar sessão
      expect(localStorage.removeItem).toHaveBeenCalled()
    })
  })

  describe('onAuthStateChange', () => {
    it('deve atualizar estado quando receber TOKEN_REFRESHED', async () => {
      let authCallback: (event: string, session: any) => void = () => {}

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        }
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockValidSession },
        error: null,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeTruthy()
      })

      // Simula evento TOKEN_REFRESHED
      const newSession = {
        ...mockValidSession,
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      }

      act(() => {
        authCallback('TOKEN_REFRESHED', newSession)
      })

      await waitFor(() => {
        expect(result.current.session?.access_token).toBe('new-access-token')
      })
    })

    it('deve limpar estado quando receber SIGNED_OUT', async () => {
      let authCallback: (event: string, session: any) => void = () => {}

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        }
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockValidSession },
        error: null,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.user).toBeTruthy()
      })

      // Simula evento SIGNED_OUT
      act(() => {
        authCallback('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
        expect(result.current.session).toBeNull()
      })
    })
  })

  describe('Tratamento de Erro Crítico', () => {
    it('deve limpar sessão em caso de erro crítico', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(
        new Error('Critical system error')
      )

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Deve ter limpado tudo
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()

      // Deve ter tentado limpar sessão
      expect(localStorage.removeItem).toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    it('deve cancelar subscription ao desmontar', async () => {
      const unsubscribeMock = vi.fn()

      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: {
          subscription: {
            unsubscribe: unsubscribeMock,
          },
        },
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const { unmount } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
      })

      unmount()

      expect(unsubscribeMock).toHaveBeenCalled()
    })
  })
})
