import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans"
import { useAuth } from "@/hooks/useAuth"
import { ArrowRight, Gift } from "lucide-react"

export default function NewUserPlans() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    // Se não tiver usuário logado, volta para auth
    if (!user) {
      navigate("/auth")
    }
  }, [user, navigate])

  const skipToApp = () => {
    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header de boas-vindas */}
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/61604d4b-329d-45cb-b4f7-386f93edfb14.png" 
              alt="Prime ERP" 
              className="h-16 w-auto" 
            />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            Bem-vindo ao Prime ERP! 🎉
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Escolha o plano que melhor se adapta às suas necessidades
          </p>
          
          {/* Card com período de teste gratuito */}
          <Card className="max-w-2xl mx-auto mb-8 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-3 text-primary">
                <Gift className="h-6 w-6" />
                <span className="text-lg font-semibold">
                  Teste grátis por 30 dias em qualquer plano!
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Experimente todas as funcionalidades sem compromisso
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Componente dos planos */}
        <div className="mb-8">
          <SubscriptionPlans />
        </div>

        {/* Opção para pular por enquanto */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-lg">Não quer escolher agora?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Você pode escolher um plano mais tarde nas configurações
              </p>
              <Button onClick={skipToApp} variant="outline" className="w-full">
                Continuar para o aplicativo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}