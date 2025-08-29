import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, FileText, Download } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/components/ui/notification-system"

const nfseList = [] // Real data from database will be loaded here

export default function NFSe() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { addNotification } = useNotifications()
  const [formData, setFormData] = useState({
    clientName: "",
    serviceDescription: "",
    value: ""
  })
  const [showReceipt, setShowReceipt] = useState(false)
  const [generatedNFSe, setGeneratedNFSe] = useState<any>(null)
  const [isGlowing, setIsGlowing] = useState(false)
  const [isError, setIsError] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "issued":
        return <Badge className="bg-primary/20 text-primary border-primary/30">Emitida</Badge>
      case "sent":
        return <Badge className="bg-success/20 text-success border-success/30">Enviada</Badge>
      default:
        return <Badge>-</Badge>
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleEmitirNota = () => {
    if (!formData.clientName || !formData.serviceDescription || !formData.value) {
      setIsError(true)
      addNotification({
        type: 'error',
        title: 'Erro ao emitir nota',
        message: 'Por favor, preencha todos os campos obrigatórios',
        duration: 4000
      })
      setTimeout(() => setIsError(false), 500)
      return
    }

    // Simulate potential error (10% chance)
    if (Math.random() < 0.1) {
      setIsError(true)
      addNotification({
        type: 'error',
        title: 'Falha na emissão',
        message: 'Erro no servidor. Tente novamente em alguns minutos.',
        duration: 5000
      })
      setTimeout(() => setIsError(false), 500)
      return
    }

    const nfseData = {
      number: `${String(nfseList.length + 1).padStart(3, '0')}`,
      client: formData.clientName,
      service: formData.serviceDescription,
      value: formData.value,
      date: new Date().toLocaleDateString(),
      issueTime: new Date().toLocaleTimeString()
    }

    setGeneratedNFSe(nfseData)
    setIsGlowing(true)
    
    // Show success notification
    addNotification({
      type: 'success',
      title: 'Nota emitida com sucesso! 🎉',
      message: `NFS-e Nº ${nfseData.number} foi gerada para ${formData.clientName}`,
      duration: 4000
    })
    
    setTimeout(() => {
      setIsGlowing(false)
      setShowReceipt(true)
    }, 800)
  }

  const downloadPDF = () => {
    // Here you would generate and download the actual PDF
    alert("PDF baixado com sucesso!")
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
          <h1 className="text-3xl font-bold tracking-tight">Parabéns! Sua primeira nota 🎉</h1>
          <p className="text-muted-foreground">Emita suas notas fiscais de serviço</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulário simplificado */}
        <Card className={`transition-all duration-300 ${isError ? 'animate-error-shake' : ''}`}>
          <CardHeader>
            <CardTitle>Nova NFS-e</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Cliente *</Label>
              <Input
                id="clientName"
                placeholder="Nome do cliente"
                value={formData.clientName}
                onChange={(e) => handleInputChange("clientName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceDescription">Serviço *</Label>
              <Textarea
                id="serviceDescription"
                placeholder="Descrição do serviço prestado"
                value={formData.serviceDescription}
                onChange={(e) => handleInputChange("serviceDescription", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Valor *</Label>
              <Input
                id="value"
                placeholder="R$ 0,00"
                value={formData.value}
                onChange={(e) => handleInputChange("value", e.target.value)}
              />
            </div>

            <Button 
              onClick={handleEmitirNota} 
              className={`w-full bg-primary hover:bg-primary/90 mt-6 transition-all duration-200 ${isGlowing ? 'animate-glow-green' : ''}`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Emitir Nota
            </Button>
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de NFS-e</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nfseList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma nota fiscal encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  nfseList.map((nfse) => (
                    <TableRow key={nfse.id}>
                      <TableCell className="font-medium">{nfse.number}</TableCell>
                      <TableCell>{nfse.client}</TableCell>
                      <TableCell>{nfse.value}</TableCell>
                      <TableCell>{new Date(nfse.date).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(nfse.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comprovante NFS-e</DialogTitle>
          </DialogHeader>
          {generatedNFSe && (
            <div className="space-y-6">
              {/* Header do comprovante */}
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">NOTA FISCAL DE SERVIÇOS ELETRÔNICA</h2>
                <p className="text-muted-foreground">NFS-e Nº {generatedNFSe.number}</p>
              </div>

              {/* Dados da nota */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Cliente</Label>
                    <p className="text-sm">{generatedNFSe.client}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Data de Emissão</Label>
                    <p className="text-sm">{generatedNFSe.date} às {generatedNFSe.issueTime}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Valor Total</Label>
                    <p className="text-lg font-bold text-primary">{generatedNFSe.value}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className="bg-success/20 text-success border-success/30">Emitida</Badge>
                  </div>
                </div>
              </div>

              {/* Serviço */}
              <div>
                <Label className="text-sm font-medium">Descrição do Serviço</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <p className="text-sm">{generatedNFSe.service}</p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={downloadPDF} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowReceipt(false)
                    setFormData({ clientName: "", serviceDescription: "", value: "" })
                  }}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}