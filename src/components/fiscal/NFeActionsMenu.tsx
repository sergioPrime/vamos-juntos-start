import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "lucide-react";
import { toast } from "sonner";
import { usePrintDANFE } from "@/hooks/usePrintDANFE";
import { NFeCancelDialog } from "@/components/fiscal/NFeCancelDialog";
import { NFeCCeDialog } from "@/components/fiscal/NFeCCeDialog";

interface NFeActionsMenuProps {
  nfeId: string;
  nfeNumero?: string;
  orgId?: string;
  status: "autorizada" | "cancelada" | "pendente" | "rejeitada" | "rascunho" | string;
  chaveAcesso: string;
  onView: () => void;
  onRefresh?: () => void;
}

export default function NFeActionsMenu({
  nfeId,
  nfeNumero = "000000",
  orgId = "",
  status,
  chaveAcesso,
  onView,
  onRefresh,
}: NFeActionsMenuProps) {
  const { printDANFE, isPrinting } = usePrintDANFE();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cceDialogOpen, setCCeDialogOpen] = useState(false);

  const handleDownloadXML = () => {
    toast.success("Download do XML iniciado");
  };

  const handleDownloadDANFE = () => {
    toast.success("Download do DANFE iniciado");
  };

  const handleSendEmail = () => {
    toast.success("Email enviado com sucesso");
  };

  const handlePrint = async () => {
    await printDANFE(nfeId);
  };

  const handleCancelSuccess = () => {
    if (onRefresh) onRefresh();
  };

  const handleCCeSuccess = () => {
    toast.info("CC-e registrada com sucesso");
  };

  const handleConsultarStatus = () => {
    toast.info("Consultando status na SEFAZ...");
  };

  const handleManifestacao = () => {
    toast.info("Abrindo Manifestação do Destinatário");
  };

  return (
    <>
      <NFeCancelDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        nfeId={nfeId}
        nfeNumero={nfeNumero}
        orgId={orgId}
        onSuccess={handleCancelSuccess}
      />

      <NFeCCeDialog
        open={cceDialogOpen}
        onClose={() => setCCeDialogOpen(false)}
        nfeId={nfeId}
        nfeNumero={nfeNumero}
        orgId={orgId}
        onSuccess={handleCCeSuccess}
      />

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
                {isPrinting ? 'Gerando DANFE...' : 'Imprimir DANFE'}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleSendEmail}>
                <Mail className="mr-2 h-4 w-4" />
                Enviar por Email
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setCCeDialogOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Carta de Correção
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => setCancelDialogOpen(true)}
                className="text-red-600 dark:text-red-400"
              >
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
    </>
  );
}
