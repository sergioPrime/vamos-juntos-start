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
import { NFeEmailDialog } from "./NFeEmailDialog";
import { NFeCancelDialog } from "./NFeCancelDialog";
import { NFeCorrectDialog } from "./NFeCorrectDialog";

interface NFeActionsMenuProps {
  status: "autorizada" | "cancelada" | "pendente" | "rejeitada";
  chaveAcesso: string;
  nfeId: string;
  nfeNumero: string;
  onView: () => void;
}

export default function NFeActionsMenu({
  status,
  chaveAcesso,
  nfeId,
  nfeNumero,
  onView,
}: NFeActionsMenuProps) {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCorrectDialog, setShowCorrectDialog] = useState(false);

  const handleDownloadXML = () => {
    toast.success("Download do XML iniciado");
  };

  const handleDownloadDANFE = () => {
    toast.success("Download do DANFE iniciado");
  };

  const handlePrint = () => {
    toast.success("Imprimindo DANFE...");
  };

  const handleConsultarStatus = () => {
    toast.info("Consultando status na SEFAZ...");
  };

  const handleManifestacao = () => {
    toast.info("Abrindo Manifestação do Destinatário");
  };

  return (
    <>
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

              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir DANFE
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setShowEmailDialog(true)}>
                <Mail className="mr-2 h-4 w-4" />
                Enviar por Email
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setShowCorrectDialog(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Carta de Correção
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setShowCancelDialog(true)}>
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

      <NFeEmailDialog
        nfeId={nfeId}
        nfeNumero={nfeNumero}
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
      />

      <NFeCancelDialog
        nfeId={nfeId}
        nfeNumero={nfeNumero}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      />

      <NFeCorrectDialog
        nfeId={nfeId}
        nfeNumero={nfeNumero}
        open={showCorrectDialog}
        onOpenChange={setShowCorrectDialog}
      />
    </>
  );
}