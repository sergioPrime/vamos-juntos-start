import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Download,
  Mail,
  Eye,
  XCircle,
  FileText,
  Printer,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { NFeCancelDialog } from "./NFeCancelDialog"
import { NFeCCeDialog } from "./NFeCCeDialog"
import { NFeConsultStatusDialog } from "./NFeConsultStatusDialog"
import { NFeEmailDialog } from "./NFeEmailDialog"
import { usePrintDANFE } from "@/hooks/usePrintDANFE"

interface NFeActionsMenuProps {
  nfeId: string
  nfeNumero: string
  status: string
  chaveAcesso: string
  orgId: string
  onView: () => void
  onRefresh?: () => void
}

export default function NFeActionsMenu({
  nfeId,
  nfeNumero,
  status,
  chaveAcesso,
  orgId,
  onView,
  onRefresh
}: NFeActionsMenuProps) {
  const { printDANFE, isPrinting } = usePrintDANFE()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cceDialogOpen, setCceDialogOpen] = useState(false)
  const [consultDialogOpen, setConsultDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)

  const handleDownloadXML = async () => {
    try {
      const { data: nfe, error } = await supabase
        .from('nfe')
        .select('xml_autorizado, numero, serie')
        .eq('id', nfeId)
        .single()

      if (error) throw error

      if (!nfe.xml_autorizado) {
        toast.error('XML não disponível')
        return
      }

      const blob = new Blob([nfe.xml_autorizado], { type: 'application/xml' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `NFe_${nfe.numero}_${nfe.serie}.xml`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("Download do XML concluído")
    } catch (error) {
      console.error('Erro ao baixar XML:', error)
      toast.error("Erro ao baixar XML")
    }
  }

  const handleDownloadDANFE = async () => {
    await printDANFE(nfeId)
  }

  const handlePrint = async () => {
    await printDANFE(nfeId)
  }

  const handleSendEmail = () => {
    setEmailDialogOpen(true)
  }

  const handleCancel = () => {
    setCancelDialogOpen(true)
  }

  const handleCartaCorrecao = () => {
    setCceDialogOpen(true)
  }

  const handleConsultarStatus = () => {
    setConsultDialogOpen(true)
  }

  const handleManifestacao = () => {
    toast.info("Abrindo Manifestação do Destinatário")
  }

  const handleCancelSuccess = () => {
    onRefresh?.()
  }

  const handleCCeSuccess = () => {
    onRefresh?.()
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Ações da NFe</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={onView}>
            <Eye className="mr-2 h-4 w-4" />
            Visualizar Detalhes
          </DropdownMenuItem>

          {status === "autorizada" && (
            <>
              <DropdownMenuItem onClick={handleDownloadXML}>
                <Download className="mr-2 h-4 w-4" />
                Download XML
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleDownloadDANFE}>
                <FileText className="mr-2 h-4 w-4" />
                Download DANFE
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handlePrint} disabled={isPrinting}>
                <Printer className="mr-2 h-4 w-4" />
                {isPrinting ? 'Imprimindo...' : 'Imprimir DANFE'}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleSendEmail}>
                <Mail className="mr-2 h-4 w-4" />
                Enviar por Email
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleCartaCorrecao}>
                <FileText className="mr-2 h-4 w-4" />
                Carta de Correção
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleCancel}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar NFe
              </DropdownMenuItem>
            </>
          )}

          {status === "pendente" && (
            <DropdownMenuItem onClick={handleConsultarStatus}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Consultar Status
            </DropdownMenuItem>
          )}

          {status === "rejeitada" && (
            <DropdownMenuItem onClick={handleConsultarStatus}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Ver Motivo da Rejeição
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleManifestacao}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Manifestação do Destinatário
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NFeCancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        nfeId={nfeId}
        nfeNumero={nfeNumero}
        chaveAcesso={chaveAcesso}
        orgId={orgId}
        onSuccess={handleCancelSuccess}
      />

      <NFeCCeDialog
        open={cceDialogOpen}
        onOpenChange={setCceDialogOpen}
        nfeId={nfeId}
        nfeNumero={nfeNumero}
        chaveAcesso={chaveAcesso}
        orgId={orgId}
        onSuccess={handleCCeSuccess}
      />

      <NFeConsultStatusDialog
        open={consultDialogOpen}
        onOpenChange={setConsultDialogOpen}
        nfeId={nfeId}
        onSuccess={onRefresh}
      />

      <NFeEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        nfeId={nfeId}
        onSuccess={onRefresh}
      />
    </div>
  )
}
