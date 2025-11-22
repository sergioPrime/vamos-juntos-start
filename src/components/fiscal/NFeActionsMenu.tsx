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

interface NFeActionsMenuProps {
  status: "autorizada" | "cancelada" | "pendente" | "rejeitada";
  chaveAcesso: string;
  onView: () => void;
  nfeId?: string;
}

export default function NFeActionsMenu({
  status,
  chaveAcesso,
  onView,
  nfeId,
}: NFeActionsMenuProps) {
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

  const handleCancel = async () => {
    if (!nfeId || !chaveAcesso) {
      toast.error("Dados da NFe não encontrados");
      return;
    }

    const justificativa = prompt("Digite a justificativa do cancelamento (mín. 15 caracteres):");
    if (!justificativa || justificativa.length < 15) {
      toast.error("A justificativa deve ter no mínimo 15 caracteres");
      return;
    }

    const confirmar = confirm("Tem certeza que deseja cancelar esta NFe? Esta ação não pode ser desfeita.");
    if (!confirmar) return;

    try {
      const { data, error } = await supabase.functions.invoke('cancelar-nfe', {
        body: { nfeId, chaveAcesso, justificativa }
      });

      if (error) throw error;

      toast.success("NFe cancelada com sucesso");
      window.location.reload();
    } catch (error: any) {
      console.error('Error canceling NFe:', error);
      toast.error(error.message || "Erro ao cancelar NFe");
    }
  };

  const handleCartaCorrecao = async () => {
    if (!nfeId || !chaveAcesso) {
      toast.error("Dados da NFe não encontrados");
      return;
    }

    const correcao = prompt("Digite o texto da correção (mín. 15 caracteres):");
    if (!correcao || correcao.length < 15) {
      toast.error("A correção deve ter no mínimo 15 caracteres");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('carta-correcao-nfe', {
        body: { nfeId, chaveAcesso, correcao }
      });

      if (error) throw error;

      toast.success("Carta de correção emitida com sucesso");
    } catch (error) {
      console.error('Error creating correction letter:', error);
      toast.error("Erro ao emitir carta de correção");
    }
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
      window.location.reload();
    } catch (error) {
      console.error('Error consulting status:', error);
      toast.error("Erro ao consultar status");
    }
  };

  const handleManifestacao = () => {
    toast.info("Abrindo Manifestação do Destinatário");
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
    </DropdownMenu>
  );
}
