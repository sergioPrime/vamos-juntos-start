import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Rocket, Zap, Target } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Seu ERP de Bolso</CardTitle>
          <p className="text-muted-foreground">
            Gerencie seu negócio MEI de forma simples e eficiente
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-sm">Cobranças via Pix instantâneas</span>
            </div>
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm">Emissão de NFS-e simplificada</span>
            </div>
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 text-primary" />
              <span className="text-sm">Controle total do seu caixa</span>
            </div>
          </div>
          
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => navigate("/onboarding/signup")}
          >
            Começar Agora
          </Button>
          
          <div className="text-center">
            <button 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              onClick={() => navigate("/dashboard")}
            >
              Já tenho uma conta
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}