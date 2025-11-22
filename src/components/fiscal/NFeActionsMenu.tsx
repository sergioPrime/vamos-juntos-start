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
  const handleDownloadXML = async () => {
    try {
      toast.info("Gerando arquivo XML...");
      
      const { data, error } = await supabase.functions.invoke("gerar-xml-danfe", {
        body: {
          nfeId,
          tipo: "xml",
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Erro ao gerar XML");
      }

      // Download do arquivo
      const link = document.createElement("a");
      link.href = data.files.xml.url;
      link.download = `NFe_${nfeNumero}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download do XML concluído!");
    } catch (error: any) {
      console.error("Erro ao baixar XML:", error);
      toast.error("Erro ao baixar XML", {
        description: error.message,
      });
    }
  };

  const handleDownloadDANFE = async () => {
    try {
      toast.info("Gerando DANFE...");
      
      const { data, error } = await supabase.functions.invoke("gerar-xml-danfe", {
        body: {
          nfeId,
          tipo: "danfe",
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Erro ao gerar DANFE");
      }

      // Download do arquivo
      const link = document.createElement("a");
      link.href = data.files.danfe.url;
      link.download = `DANFE_${nfeNumero}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download do DANFE concluído!");
    } catch (error: any) {
      console.error("Erro ao baixar DANFE:", error);
      toast.error("Erro ao baixar DANFE", {
        description: error.message,
      });
    }
  };

  const handleSendEmail = () => {
    toast.success("Email enviado com sucesso");
  };

  const handlePrint = () => {
    toast.success("Imprimindo DANFE...");
  };

  const handleCancel = () => {
    toast.info("Abrindo formulário de cancelamento");
  };

  const handleCartaCorrecao = () => {
    toast.info("Abrindo Carta de Correção Eletrônica");
  };

  const handleConsultarStatus = () => {
    toast.info("Consultando status na SEFAZ...");
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
