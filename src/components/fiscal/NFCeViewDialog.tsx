import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, Printer, Mail, QrCode } from "lucide-react"
import { format } from "date-fns"

interface NFCeViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nfce: {
    id: string
    numero: number
    serie: string
    chave_acesso: string
    status: string
    data_emissao: string
    valor_total: number
    destinatario_nome: string
    destinatario_cpf_cnpj: string | null
    protocolo_autorizacao: string | null
    qr_code: string | null
    xml_content: string | null
  }
}

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    autorizada: { label: "Autorizada", variant: "default" },
    cancelada: { label: "Cancelada", variant: "secondary" },
    rejeitada: { label: "Rejeitada", variant: "destructive" },
    pendente: { label: "Pendente", variant: "outline" },
  }
  
  const config = statusMap[status] || { label: status, variant: "outline" }
  
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export const NFCeViewDialog = ({ open, onOpenChange, nfce }: NFCeViewDialogProps) => {
  const handleDownloadXML = () => {
    if (!nfce.xml_content) return
    
    const blob = new Blob([nfce.xml_content], { type: 'application/xml' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `NFCe_${nfce.numero}_${nfce.serie}.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSendEmail = () => {
    // TODO: Implementar envio de email
    console.log('Send email', nfce.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            NFC-e - Nº {nfce.numero} / Série {nfce.serie}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            {getStatusBadge(nfce.status)}
          </div>

          <Separator />

          {/* Informações da Nota */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Dados da NFC-e</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Número:</dt>
                  <dd className="font-mono font-bold">{nfce.numero}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Série:</dt>
                  <dd className="font-mono">{nfce.serie}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Data Emissão:</dt>
                  <dd>{format(new Date(nfce.data_emissao), 'dd/MM/yyyy HH:mm')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Valor Total:</dt>
                  <dd className="font-bold">
                    {nfce.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Destinatário</h4>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Nome:</dt>
                  <dd className="font-medium">{nfce.destinatario_nome}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">CPF/CNPJ:</dt>
                  <dd className="font-mono">{nfce.destinatario_cpf_cnpj || 'Não informado'}</dd>
                </div>
              </dl>
            </div>
          </div>

          <Separator />

          {/* Chave de Acesso */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Chave de Acesso</h4>
            <div className="bg-muted p-3 rounded-md">
              <code className="text-xs font-mono break-all">{nfce.chave_acesso}</code>
            </div>
          </div>

          {/* Protocolo */}
          {nfce.protocolo_autorizacao && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Protocolo de Autorização</h4>
              <div className="bg-muted p-3 rounded-md">
                <code className="text-xs font-mono">{nfce.protocolo_autorizacao}</code>
              </div>
            </div>
          )}

          {/* QR Code */}
          {nfce.qr_code && (
            <div className="flex flex-col items-center gap-2">
              <h4 className="text-sm font-semibold">QR Code</h4>
              <div className="bg-white p-4 rounded-md border">
                <QrCode className="h-32 w-32 text-gray-900" />
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Consulte a NFC-e pelo QR Code
                </p>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadXML}
              disabled={!nfce.xml_content}
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar XML
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir DANFE
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendEmail}
            >
              <Mail className="mr-2 h-4 w-4" />
              Enviar por Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
