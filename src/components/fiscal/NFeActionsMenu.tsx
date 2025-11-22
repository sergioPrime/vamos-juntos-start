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
import NFeCancelDialog from "./NFeCancelDialog";
import NFeCorrectDialog from "./NFeCorrectDialog";
import NFeStatusDialog from "./NFeStatusDialog";
import NFeManifestDialog from "./NFeManifestDialog";

interface NFeActionsMenuProps {
  status: "autorizada" | "cancelada" | "pendente" | "rejeitada";
  chaveAcesso: string;
  nfeId: string;
  nfeNumero: string;
  onView: () => void;
  onUpdate?: () => void;
}

export default function NFeActionsMenu({
  status,
  chaveAcesso,
  nfeId,
  nfeNumero,
  onView,
  onUpdate,
}: NFeActionsMenuProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [correctDialogOpen, setCorrectDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [manifestDialogOpen, setManifestDialogOpen] = useState(false);
  const handleDownloadXML = () => {
    toast.success("Download do XML iniciado");
  };

  const handleDownloadDANFE = () => {
    toast.success("Download do DANFE iniciado");
  };

  const handleSendEmail = () => {
    toast.success("Email enviado com sucesso");
  };

  const handlePrint = () => {
    toast.success("Imprimindo DANFE...");
  };

  const handleCancel = () => {
    setCancelDialogOpen(true);
  };

  const handleCartaCorrecao = () => {
    setCorrectDialogOpen(true);
  };

  const handleConsultarStatus = () => {
    setStatusDialogOpen(true);
  };

  const handleManifestacao = () => {
    setManifestDialogOpen(true);
  };

  return (
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

      <NFeCancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        nfeId={nfeId}
        nfeNumero={nfeNumero}
        chaveAcesso={chaveAcesso}
        onSuccess={onUpdate}
      />

      <NFeCorrectDialog
        open={correctDialogOpen}
        onOpenChange={setCorrectDialogOpen}
        nfeId={nfeId}
        nfeNumero={nfeNumero}
        chaveAcesso={chaveAcesso}
        onSuccess={onUpdate}
      />

      <NFeStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        nfeId={nfeId}
        nfeNumero={nfeNumero}
        chaveAcesso={chaveAcesso}
        onSuccess={onUpdate}
      />

      <NFeManifestDialog
        open={manifestDialogOpen}
        onOpenChange={setManifestDialogOpen}
        nfeId={nfeId}
        nfeNumero={nfeNumero}
        chaveAcesso={chaveAcesso}
        onSuccess={onUpdate}
      />
    </DropdownMenu>
  );
}
