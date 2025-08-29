import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, MessageCircle, Zap, Eye, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

const mockQuotes = [
  { id: 1, client: "João Silva", description: "Website corporativo", value: "R$ 3.500,00", date: "2024-01-10", status: "pending" },
  { id: 2, client: "Maria Santos", description: "Sistema de vendas", value: "R$ 8.000,00", date: "2024-01-12", status: "accepted" },
]

export default function Quotes() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    client: "",
    description: "",
    value: "",
    observations: ""
  })
  const [showNewQuote, setShowNewQuote] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<any>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleWhatsAppSend = () => {
    if (!formData.client || !formData.description || !formData.value) {
      alert("Por favor, preencha todos os campos obrigatórios")
      return
    }
    
    const message = `🤝 *ORÇAMENTO*\n\n👤 *Cliente:* ${formData.client}\n📋 *Serviço:* ${formData.description}\n💰 *Valor:* ${formData.value}\n\n📝 *Observações:* ${formData.observations}\n\n✅ Para aceitar este orçamento, responda "ACEITO"`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const handleConvertToPix = () => {
    if (!formData.client || !formData.description || !formData.value) {
      alert("Por favor, preencha todos os campos obrigatórios")
      return
    }
    navigate("/finance/receivables")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-success/20 text-success border-success/30">Aceito</Badge>
      case "pending":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Pendente</Badge>
      case "rejected":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Rejeitado</Badge>
      default:
        return <Badge>-</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="p-2 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vamos fechar negócio? 📝</h1>
          <p className="text-muted-foreground">Crie orçamentos que convertem</p>
        </div>
      </div>

      {/* New Quote Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowNewQuote(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      {/* Quotes History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Orçamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.client}</TableCell>
                  <TableCell>{quote.description}</TableCell>
                  <TableCell>{quote.value}</TableCell>
                  <TableCell>{new Date(quote.date).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(quote.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedQuote(quote)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      {quote.status === "accepted" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate("/finance/receivables")}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Gerar Cobrança
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Quote Dialog */}
      <Dialog open={showNewQuote} onOpenChange={setShowNewQuote}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Orçamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select value={formData.client} onValueChange={(value) => handleInputChange("client", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="João Silva">João Silva</SelectItem>
                  <SelectItem value="Maria Santos">Maria Santos</SelectItem>
                  <SelectItem value="Empresa ABC">Empresa ABC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição dos Serviços *</Label>
              <Textarea
                id="description"
                placeholder="Descreva os serviços ou produtos do orçamento"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Valor Total *</Label>
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

            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={handleWhatsAppSend} className="w-full bg-success hover:bg-success/90">
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar no WhatsApp
              </Button>
              
              <Button 
                onClick={handleConvertToPix} 
                variant="outline" 
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Converter em Cobrança Pix
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quote Detail Dialog */}
      <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Orçamento</DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <p className="font-medium">{selectedQuote.client}</p>
                </div>
                <div>
                  <Label>Valor</Label>
                  <p className="font-medium">{selectedQuote.value}</p>
                </div>
                <div>
                  <Label>Data</Label>
                  <p>{new Date(selectedQuote.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedQuote.status)}</div>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <p>{selectedQuote.description}</p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => {
                  const message = `🤝 *ORÇAMENTO*\n\n👤 *Cliente:* ${selectedQuote.client}\n📋 *Serviço:* ${selectedQuote.description}\n💰 *Valor:* ${selectedQuote.value}`
                  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank")
                }}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Reenviar WhatsApp
                </Button>
                {selectedQuote.status === "accepted" && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedQuote(null)
                      navigate("/finance/receivables")
                    }}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Converter em Cobrança
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}