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
import NFeCancelDialog from "./NFeCancelDialog";
import NFeCorrectDialog from "./NFeCorrectDialog";

interface NFeActionsMenuProps {
  status: "autorizada" | "cancelada" | "pendente" | "rejeitada" | "rascunho";
  chaveAcesso: string;
  onView: () => void;
  nfeId?: string;
  nfeNumero?: string;
  onRefresh?: () => void;
}

export default function NFeActionsMenu({
  status,
  chaveAcesso,
  onView,
  nfeId,
  nfeNumero,
  onRefresh,
}: NFeActionsMenuProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCorrectDialog, setShowCorrectDialog] = useState(false);

  const handleDownloadXML = () => {
    toast.success("Download do XML iniciado");
  };

  const handleDownloadDANFE = async () => {
    if (!nfeId) {
      toast.error("ID da NFe não encontrado");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('gerar-danfe', {
        body: { nfeId }
      });

      if (error) throw error;

      const blob = new Blob([data.html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DANFE-${data.nfeNumber}-${data.serie}.html`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("DANFE baixado com sucesso");
    } catch (error) {
      console.error('Error downloading DANFE:', error);
      toast.error("Erro ao baixar DANFE");
    }
  };

  const handleSendEmail = async () => {
    if (!nfeId) {
      toast.error("ID da NFe não encontrado");
      return;
    }

    const email = prompt("Digite o email do destinatário:");
    if (!email) return;

    try {
      const { error } = await supabase.functions.invoke('enviar-email-nfe', {
        body: { nfeId, destinatarioEmail: email }
      });

      if (error) throw error;

      toast.success("Email enviado com sucesso");
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error("Erro ao enviar email");
    }
  };

  const handlePrint = async () => {
    if (!nfeId) {
      toast.error("ID da NFe não encontrado");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('gerar-danfe', {
        body: { nfeId }
      });

      if (error) throw error;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data.html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }

      toast.success("DANFE preparado para impressão");
    } catch (error) {
      console.error('Error printing DANFE:', error);
      toast.error("Erro ao imprimir DANFE");
    }
  };

  const handleCancel = () => {
    if (!nfeId || !chaveAcesso || !nfeNumero) {
      toast.error("Dados da NFe não encontrados");
      return;
    }
    setShowCancelDialog(true);
  };

  const handleCartaCorrecao = () => {
    if (!nfeId || !chaveAcesso || !nfeNumero) {
      toast.error("Dados da NFe não encontrados");
      return;
    }
    setShowCorrectDialog(true);
  };

  const handleConsultarStatus = async () => {
    if (!nfeId || !chaveAcesso) {
      toast.error("Dados da NFe não encontrados");
      return;
    }

    try {
      toast.info("Consultando status na SEFAZ...");
      const { data, error } = await supabase.functions.invoke('consultar-status-nfe', {
        body: { nfeId, chaveAcesso }
      });

      if (error) throw error;

      toast.success(data.mensagem);
      
      if (onRefresh) {
        onRefresh();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error consulting status:', error);
      toast.error("Erro ao consultar status");
    }
  };

  const handleManifestacao = () => {
    toast.info("Abrindo Manifestação do Destinatário");
  };

  const handleDialogSuccess = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
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

      {/* Dialogs */}
      {nfeId && nfeNumero && chaveAcesso && (
        <>
          <NFeCancelDialog
            open={showCancelDialog}
            onOpenChange={setShowCancelDialog}
            nfeId={nfeId}
            nfeNumero={nfeNumero}
            chaveAcesso={chaveAcesso}
            onSuccess={handleDialogSuccess}
          />
          <NFeCorrectDialog
            open={showCorrectDialog}
            onOpenChange={setShowCorrectDialog}
            nfeId={nfeId}
            nfeNumero={nfeNumero}
            chaveAcesso={chaveAcesso}
            onSuccess={handleDialogSuccess}
          />
        </>
      )}
    </>
  );
}
