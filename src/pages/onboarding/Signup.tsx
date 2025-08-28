import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate("/onboarding/business-type")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/onboarding")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Criar Conta</CardTitle>
          </div>
          <p className="text-muted-foreground">
            Cadastre-se para começar a usar o MEI ERP
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail ou WhatsApp</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com ou (11) 99999-9999"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Crie uma senha segura"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Continuar
            </Button>

            <div className="text-center">
              <Button variant="outline" className="w-full">
                Entrar com gov.br (opcional)
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}