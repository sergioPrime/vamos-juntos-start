import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Send, MessageCircle } from "lucide-react"

export default function Quotes() {
  const [formData, setFormData] = useState({
    client: "",
    description: "",
    value: "",
    observations: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleWhatsAppSend = () => {
    const message = `Olá! Segue seu orçamento:\n\nDescrição: ${formData.description}\nValor: ${formData.value}\n\nObservações: ${formData.observations}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orçamentos</h1>
        <p className="text-muted-foreground">Crie e gerencie seus orçamentos</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Novo Orçamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select value={formData.client} onValueChange={(value) => handleInputChange("client", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="joao">João Silva</SelectItem>
                  <SelectItem value="maria">Maria Santos</SelectItem>
                  <SelectItem value="empresa">Empresa ABC</SelectItem>
                  <SelectItem value="novo">+ Novo Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição dos Itens/Serviços</Label>
              <Textarea
                id="description"
                placeholder="Descreva os serviços ou produtos do orçamento"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Valor Total</Label>
              <Input
                id="value"
                placeholder="R$ 0,00"
                value={formData.value}
                onChange={(e) => handleInputChange("value", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                placeholder="Condições de pagamento, prazo de entrega, etc."
                value={formData.observations}
                onChange={(e) => handleInputChange("observations", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Gerar PDF
              </Button>
              
              <Button variant="outline" className="w-full" onClick={handleWhatsAppSend}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar no WhatsApp
              </Button>
              
              <Button variant="outline" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Marcar como "Aceito"
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center bg-muted/10">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Pré-visualização do orçamento em formato A4 será exibida aqui
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Complete os dados do formulário para ver o preview
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}