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
import { supabase } from "@/integrations/supabase/client";
import NFeEmailDialog from "./NFeEmailDialog";
import NFeCorrectDialog from "./NFeCorrectDialog";
import NFeCancelDialog from "./NFeCancelDialog";
import NFeStatusDialog from "./NFeStatusDialog";
import NFeManifestDialog from "./NFeManifestDialog";
import NFeDetailsDialog from "./NFeDetailsDialog";

interface NFeActionsMenuProps {
  status: "autorizada" | "cancelada" | "pendente" | "rejeitada";
  chaveAcesso: string;
  nfeId: string;
  nfeNumero: string;
  clienteEmail?: string;
  onView: () => void;
  onUpdate?: () => void;
}

export default function NFeActionsMenu({
  status,
  chaveAcesso,
  nfeId,
  nfeNumero,
  clienteEmail,
  onView,
  onUpdate,
}: NFeActionsMenuProps) {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [correctDialogOpen, setCorrectDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [manifestDialogOpen, setManifestDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadXML = async () => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-xml-danfe", {
        body: { nfeId },
      });

      if (error) throw error;

      if (data?.xml_url) {
        window.open(data.xml_url, "_blank");
        toast.success("Download do XML iniciado");
      } else {
        throw new Error("URL do XML não disponível");
      }
    } catch (error: any) {
      console.error("Erro ao baixar XML:", error);
      toast.error(error.message || "Erro ao baixar XML");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadDANFE = async () => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-xml-danfe", {
        body: { nfeId },
      });

      if (error) throw error;

      if (data?.danfe_url) {
        window.open(data.danfe_url, "_blank");
        toast.success("Download do DANFE iniciado");
      } else {
        throw new Error("URL do DANFE não disponível");
      }
    } catch (error: any) {
      console.error("Erro ao baixar DANFE:", error);
      toast.error(error.message || "Erro ao baixar DANFE");
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = () => {
    setEmailDialogOpen(true);
  };

  const handlePrint = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("gerar-xml-danfe", {
        body: { nfeId },
      });

      if (error) throw error;

      if (data?.danfe_url) {
        const printWindow = window.open(data.danfe_url, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
        toast.success("Abrindo DANFE para impressão...");
      }
    } catch (error: any) {
      console.error("Erro ao imprimir:", error);
      toast.error("Erro ao abrir DANFE para impressão");
    }
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

  const handleViewDetails = () => {
    setDetailsDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={downloading}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Ações da NFe</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            Visualizar Detalhes
          </DropdownMenuItem>

          {status === "autorizada" && (
            <>
              <DropdownMenuItem onClick={handleDownloadXML} disabled={downloading}>
                <Download className="mr-2 h-4 w-4" />
                Download XML
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleDownloadDANFE} disabled={downloading}>
                <FileText className="mr-2 h-4 w-4" />
                Download DANFE
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handlePrint} disabled={downloading}>
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
      </DropdownMenu>

      <NFeEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        nfeId={nfeId}
        nfeNumero={nfeNumero}
        clienteEmail={clienteEmail}
        onSuccess={onUpdate}
      />

      <NFeCorrectDialog
        open={correctDialogOpen}
        onOpenChange={setCorrectDialogOpen}
        nfeId={nfeId}
        nfeNumero={nfeNumero}
        onSuccess={onUpdate}
      />

      <NFeCancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        nfeId={nfeId}
        nfeNumero={nfeNumero}
        onSuccess={onUpdate}
      />

      <NFeStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        nfeId={nfeId}
        nfeNumero={nfeNumero}
        onSuccess={onUpdate}
      />

      <NFeManifestDialog
        open={manifestDialogOpen}
        onOpenChange={setManifestDialogOpen}
        nfeId={nfeId}
        nfeNumero={nfeNumero}
        onSuccess={onUpdate}
      />

      <NFeDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        nfeId={nfeId}
      />
    </>
  );
}
