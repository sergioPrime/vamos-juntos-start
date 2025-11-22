import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Search, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useNFCe } from "@/hooks/useNFCe"
import { format } from "date-fns"

interface NFCeStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nfce: {
    id: string
    numero: number
    serie: string
    chave_acesso: string
    status: string
  }
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'autorizada':
      return <CheckCircle className="h-8 w-8 text-green-500" />
    case 'rejeitada':
      return <XCircle className="h-8 w-8 text-red-500" />
    case 'cancelada':
      return <XCircle className="h-8 w-8 text-gray-500" />
    case 'pendente':
      return <Clock className="h-8 w-8 text-yellow-500" />
    default:
      return <AlertCircle className="h-8 w-8 text-blue-500" />
  }
}

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    autorizada: { label: "Autorizada", variant: "default" },
    cancelada: { label: "Cancelada", variant: "secondary" },
    rejeitada: { label: "Rejeitada", variant: "destructive" },
    pendente: { label: "Pendente", variant: "outline" },
    processando: { label: "Processando", variant: "outline" },
  }
  
  const config = statusMap[status.toLowerCase()] || { label: status, variant: "outline" }
  
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export const NFCeStatusDialog = ({ open, onOpenChange, nfce }: NFCeStatusDialogProps) => {
  const { toast } = useToast()
  const { queryNFCeStatus, isLoading } = useNFCe()
  const [statusData, setStatusData] = useState<any>(null)
  const [querying, setQuerying] = useState(false)

  const handleQuery = async () => {
    setQuerying(true)
    
    try {
      const result = await queryNFCeStatus(nfce.id)

      if (result.success) {
        setStatusData(result.data)
        toast({
          title: "Status consultado",
          description: "Status da NFC-e atualizado com sucesso.",
        })
      } else {
        toast({
          title: "Erro ao consultar status",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro ao consultar status",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setQuerying(false)
    }
  }

  const handleClose = () => {
    setStatusData(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Consultar Status - NFC-e {nfce.numero}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações básicas */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Número:</span>
              <span className="font-mono font-bold">{nfce.numero}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Série:</span>
              <span className="font-mono">{nfce.serie}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status Atual:</span>
              {getStatusBadge(nfce.status)}
            </div>
          </div>

          {/* Chave de acesso */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Chave de Acesso</h4>
            <div className="bg-muted p-3 rounded-md">
              <code className="text-xs font-mono break-all">{nfce.chave_acesso}</code>
            </div>
          </div>

          {/* Resultado da consulta */}
          {statusData && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-center py-2">
                  {getStatusIcon(statusData.status)}
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-bold mb-2">Status na SEFAZ</h3>
                  {getStatusBadge(statusData.status)}
                </div>

                {statusData.protocolo && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Protocolo</h4>
                    <div className="bg-muted p-3 rounded-md">
                      <code className="text-xs font-mono">{statusData.protocolo}</code>
                    </div>
                  </div>
                )}

                {statusData.motivo && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Motivo</h4>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm">{statusData.motivo}</p>
                    </div>
                  </div>
                )}

                {statusData.dataAutorizacao && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Data de Autorização:</span>
                    <span className="font-medium">
                      {format(new Date(statusData.dataAutorizacao), 'dd/MM/yyyy HH:mm:ss')}
                    </span>
                  </div>
                )}

                {statusData.dataCancelamento && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Data de Cancelamento:</span>
                    <span className="font-medium">
                      {format(new Date(statusData.dataCancelamento), 'dd/MM/yyyy HH:mm:ss')}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Loading state */}
          {querying && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Consultando SEFAZ...</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {!statusData && !querying && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
              <Button onClick={handleQuery} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Consultar SEFAZ
              </Button>
            </>
          )}

          {(statusData || querying) && (
            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
