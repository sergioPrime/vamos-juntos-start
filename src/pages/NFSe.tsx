import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, FileText, Upload } from "lucide-react"

const mockNFSe = [
  { id: 1, number: "001", client: "João Silva", value: "R$ 2.500,00", date: "2024-01-15", status: "issued" },
  { id: 2, number: "002", client: "Maria Santos", value: "R$ 1.200,00", date: "2024-01-20", status: "sent" },
]

export default function NFSe() {
  const [formData, setFormData] = useState({
    clientName: "",
    clientDocument: "",
    clientEmail: "",
    serviceDescription: "",
    value: "",
    date: ""
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "issued":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Emitida</Badge>
      case "sent":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Enviada</Badge>
      default:
        return <Badge>-</Badge>
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleOpenGovPortal = () => {
    window.open("https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/servicos-para-mei/emissao-de-nota-fiscal", "_blank")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">NFS-e</h1>
        <p className="text-muted-foreground">Emita suas notas fiscais de serviço</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nova NFS-e</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input
                id="clientName"
                placeholder="Nome completo ou razão social"
                value={formData.clientName}
                onChange={(e) => handleInputChange("clientName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientDocument">CPF/CNPJ</Label>
              <Input
                id="clientDocument"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={formData.clientDocument}
                onChange={(e) => handleInputChange("clientDocument", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">E-mail</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="cliente@email.com"
                value={formData.clientEmail}
                onChange={(e) => handleInputChange("clientEmail", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceDescription">Serviço Prestado</Label>
              <Textarea
                id="serviceDescription"
                placeholder="Descreva o serviço prestado"
                value={formData.serviceDescription}
                onChange={(e) => handleInputChange("serviceDescription", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Valor</Label>
                <Input
                  id="value"
                  placeholder="R$ 0,00"
                  value={formData.value}
                  onChange={(e) => handleInputChange("value", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={handleOpenGovPortal} className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Emissor Nacional (gov.br)
              </Button>
              
              <Button variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Anexar PDF da NFS-e
              </Button>
            </div>
          </CardContent>
        </Card>

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
                {mockNFSe.map((nfse) => (
                  <TableRow key={nfse.id}>
                    <TableCell className="font-medium">{nfse.number}</TableCell>
                    <TableCell>{nfse.client}</TableCell>
                    <TableCell>{nfse.value}</TableCell>
                    <TableCell>{new Date(nfse.date).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(nfse.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}