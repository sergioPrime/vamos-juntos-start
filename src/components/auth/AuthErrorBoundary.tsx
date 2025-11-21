import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: error.message
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Auth Error Boundary capturou erro:', error, errorInfo)
    
    // Log adicional para erros de autenticação
    if (error.message?.includes('auth') || error.message?.includes('token')) {
      console.error('Erro de autenticação detectado:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  handleReset = () => {
    // Limpa o localStorage de autenticação
    try {
      localStorage.removeItem('sb-wrdyffwjlylgxfbxbztf-auth-token')
      console.info('Token de autenticação removido')
    } catch (e) {
      console.error('Erro ao limpar storage:', e)
    }

    // Reseta o estado e recarrega
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    
    // Recarrega a página após um pequeno delay
    setTimeout(() => {
      window.location.href = '/auth'
    }, 100)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Erro de Autenticação</CardTitle>
              <CardDescription>
                Ocorreu um problema com sua sessão de autenticação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.errorInfo && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p className="font-mono text-xs text-muted-foreground break-all">
                    {this.state.errorInfo}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Button 
                  onClick={this.handleReset}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Limpar Sessão e Fazer Login
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  className="w-full"
                  variant="outline"
                >
                  Tentar Novamente
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Se o problema persistir, tente limpar o cache do navegador
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
