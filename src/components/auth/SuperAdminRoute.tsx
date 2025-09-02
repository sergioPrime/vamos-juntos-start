import { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useSuperAdmin } from "@/hooks/useSuperAdmin"
import { useAuth } from "@/hooks/useAuth"
import { Shield } from "lucide-react"

interface SuperAdminRouteProps {
  children: ReactNode
}

export function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { user } = useAuth()
  const { isSuperAdmin, loading } = useSuperAdmin()

  // Se não está logado, redireciona para login
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Mostra loading enquanto verifica permissões
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
          <div>
            <h2 className="text-xl font-semibold">Verificando Permissões</h2>
            <p className="text-muted-foreground">
              Aguarde enquanto verificamos seus privilégios de acesso...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Se não é superadmin, redireciona para dashboard
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  // Se é superadmin, renderiza o componente
  return <>{children}</>
}