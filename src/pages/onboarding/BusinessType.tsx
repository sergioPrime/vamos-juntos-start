import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Wrench, Package } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function BusinessType() {
  const navigate = useNavigate()

  const handleBusinessTypeSelect = (type: "services" | "products") => {
    // Store business type in localStorage for now
    localStorage.setItem("businessType", type)
    navigate("/onboarding/tutorial")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/onboarding/signup")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Tipo de Negócio</CardTitle>
          </div>
          <p className="text-muted-foreground">
            Isso nos ajuda a personalizar sua experiência
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full h-20 flex flex-col gap-2"
            onClick={() => handleBusinessTypeSelect("services")}
          >
            <Wrench className="h-6 w-6" />
            <span>Presto Serviços</span>
            <span className="text-xs text-muted-foreground">Consultoria, desenvolvimento, design, etc.</span>
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-20 flex flex-col gap-2"
            onClick={() => handleBusinessTypeSelect("products")}
          >
            <Package className="h-6 w-6" />
            <span>Vendo Produtos</span>
            <span className="text-xs text-muted-foreground">Artesanato, roupas, alimentação, etc.</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}