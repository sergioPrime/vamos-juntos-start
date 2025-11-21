import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {}
})

// Função para limpar sessão corrompida
const clearCorruptedSession = async () => {
  try {
    // Remove tokens do localStorage
    localStorage.removeItem('sb-wrdyffwjlylgxfbxbztf-auth-token')
    
    // Força signOut no Supabase
    await supabase.auth.signOut({ scope: 'local' })
    
    console.info('Sessão corrompida limpa com sucesso')
  } catch (error) {
    console.error('Erro ao limpar sessão corrompida:', error)
  }
}

// Verifica se é erro de refresh token
const isRefreshTokenError = (error: AuthError): boolean => {
  return error.message?.includes('refresh_token') || 
         error.message?.includes('Refresh Token') ||
         error.code === 'refresh_token_not_found'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  useEffect(() => {
    let mounted = true
    let authSubscription: { unsubscribe: () => void } | null = null

    const initializeAuth = async () => {
      try {
        // Primeiro, tenta obter a sessão atual
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Erro ao obter sessão:', sessionError)
          
          // Se for erro de refresh token, limpa a sessão corrompida
          if (isRefreshTokenError(sessionError)) {
            console.warn('Sessão corrompida detectada, limpando...')
            await clearCorruptedSession()
            
            if (mounted) {
              setSession(null)
              setUser(null)
              setLoading(false)
            }
            return
          }
          
          // Para outros erros, tenta retry se ainda não excedeu o limite
          if (retryCount < MAX_RETRIES) {
            console.log(`Tentando novamente... (${retryCount + 1}/${MAX_RETRIES})`)
            setTimeout(() => {
              if (mounted) {
                setRetryCount(prev => prev + 1)
              }
            }, 1000 * (retryCount + 1)) // Exponential backoff
            return
          }
        }

        if (mounted) {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          setLoading(false)
          setRetryCount(0) // Reset retry count on success
        }

        // Configura listener de mudanças de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!mounted) return

            console.log('Auth state change:', event)

            // Trata eventos específicos
            if (event === 'TOKEN_REFRESHED') {
              console.info('Token atualizado com sucesso')
            }

            if (event === 'SIGNED_OUT') {
              setSession(null)
              setUser(null)
            } else {
              setSession(newSession)
              setUser(newSession?.user ?? null)
            }
            
            setLoading(false)
          }
        )

        authSubscription = subscription

      } catch (error) {
        console.error('Erro crítico na inicialização de auth:', error)
        
        if (mounted) {
          // Em caso de erro crítico, limpa tudo e marca como não carregando
          await clearCorruptedSession()
          setSession(null)
          setUser(null)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
      authSubscription?.unsubscribe()
    }
  }, [retryCount])

  const signOut = async () => {
    try {
      setLoading(true)
      
      // Tenta signOut normal primeiro
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Erro ao fazer logout:', error)
        
        // Se falhar, força limpeza local
        if (isRefreshTokenError(error)) {
          await clearCorruptedSession()
        }
        
        toast.error('Erro ao fazer logout, mas sessão local foi limpa')
      } else {
        toast.success('Logout realizado com sucesso')
      }
      
      // Garante que o estado é limpo localmente
      setSession(null)
      setUser(null)
    } catch (error) {
      console.error('Erro crítico no logout:', error)
      
      // Força limpeza mesmo com erro
      await clearCorruptedSession()
      setSession(null)
      setUser(null)
      
      toast.error('Sessão encerrada localmente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}