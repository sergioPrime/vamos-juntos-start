import { useAuth } from "@/hooks/useAuth"
import { useOrganization } from "@/hooks/useOrganization"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { QuickAccessCards } from "@/components/dashboard/QuickAccessCards"

export default function Dashboard() {
  const { user } = useAuth()
  const { currentOrg, loading: orgLoading } = useOrganization()
  const navigate = useNavigate()

  // Get current hour for greeting
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? "Bom dia" : currentHour < 18 ? "Boa tarde" : "Boa noite"
  
  // Get user's first name
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Usuário'

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg mb-4">Nenhuma organização encontrada</div>
          <p className="text-muted-foreground mb-4">
            Você precisa estar associado a uma organização para acessar o dashboard.
          </p>
          <Button onClick={() => navigate('/settings')}>
            Ir para Configurações
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header com Saudação */}
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold">
          {greeting}, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground">
          Acesse rapidamente os principais módulos do Prime ERP
        </p>
      </div>

      {/* Cartões de Acesso Rápido */}
      <QuickAccessCards />
    </div>
  )
}