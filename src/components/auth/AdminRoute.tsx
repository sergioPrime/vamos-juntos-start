import { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useRoleCheck } from "@/hooks/useRoleCheck"
import { useAuth } from "@/hooks/useAuth"
import { Shield } from "lucide-react"

interface AdminRouteProps {
  children: ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user } = useAuth()
  const { isAdmin, loading } = useRoleCheck()

  if (!user) {
    return <Navigate to="/auth" replace />
  }

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

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
