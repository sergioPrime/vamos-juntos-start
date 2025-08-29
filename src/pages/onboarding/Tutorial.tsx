import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Smartphone, FileText, BarChart3 } from "lucide-react"
import { useNavigate } from "react-router-dom"

const tutorialSteps = [
  {
    icon: Smartphone,
    title: "1. Receba via Pix",
    description: "Crie cobranças instantâneas com QR Code e acompanhe os pagamentos em tempo real"
  },
  {
    icon: FileText,
    title: "2. Emita Orçamento",
    description: "Crie orçamentos profissionais e converta em vendas rapidamente"
  },
  {
    icon: BarChart3,
    title: "3. Acompanhe seu Caixa",
    description: "Relatórios automáticos e controle completo das suas finanças"
  }
]

export default function Tutorial() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      navigate("/dashboard")
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else {
      navigate("/onboarding/business-type")
    }
  }

  const currentTutorial = tutorialSteps[currentStep]
  const Icon = currentTutorial.icon

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrevious}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Como Funciona</CardTitle>
          </div>
          <div className="flex gap-2 mt-4">
            {tutorialSteps.map((_, index) => (
              <div 
                key={index}
                className={`h-2 flex-1 rounded ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{currentTutorial.title}</h3>
            <p className="text-muted-foreground">{currentTutorial.description}</p>
          </div>

          <Button onClick={handleNext} className="w-full">
            {currentStep < tutorialSteps.length - 1 ? (
              <>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              "Começar a Usar"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}