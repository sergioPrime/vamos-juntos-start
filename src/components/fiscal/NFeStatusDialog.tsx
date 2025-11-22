import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NFeStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfeId: string;
  nfeNumero: string;
  chaveAcesso: string;
  onSuccess?: () => void;
}

interface StatusData {
  status: string;
  protocolo: string;
  dataHora: string;
  mensagem: string;
}

export default function NFeStatusDialog({
  open,
  onOpenChange,
  nfeId,
  nfeNumero,
  chaveAcesso,
  onSuccess,
}: NFeStatusDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusData, setStatusData] = useState<StatusData | null>(null);

  const handleConsultar = async () => {
    setIsLoading(true);
    setStatusData(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "consultar-status-nfe",
        {
          body: { nfeId },
        }
      );

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Erro ao consultar status");
      }

      setStatusData(data.data);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao consultar status:", error);
      toast.error("Erro ao consultar status", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "autorizada":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelada":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "rejeitada":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "pendente":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "autorizada":
        return <Badge className="bg-green-500">Autorizada</Badge>;
      case "cancelada":
        return <Badge variant="destructive">Cancelada</Badge>;
      case "rejeitada":
        return <Badge variant="destructive">Rejeitada</Badge>;
      case "pendente":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Consultar Status na SEFAZ</DialogTitle>
          <DialogDescription>
            Verifique a situação atual da NFe nº {nfeNumero} na SEFAZ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Chave de Acesso</p>
            <p className="text-sm text-muted-foreground font-mono break-all">
              {chaveAcesso}
            </p>
          </div>

          {statusData ? (
            <Alert className="border-2">
              <div className="flex items-start gap-3">
                {getStatusIcon(statusData.status)}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Status:</span>
                    {getStatusBadge(statusData.status)}
                  </div>

                  <div>
                    <span className="font-semibold">Protocolo:</span>
                    <p className="text-sm text-muted-foreground font-mono">
                      {statusData.protocolo}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold">Data/Hora:</span>
                    <p className="text-sm text-muted-foreground">
                      {new Date(statusData.dataHora).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold">Mensagem SEFAZ:</span>
                    <p className="text-sm text-muted-foreground">
                      {statusData.mensagem}
                    </p>
                  </div>
                </div>
              </div>
            </Alert>
          ) : (
            <Alert>
              <AlertDescription>
                Clique em "Consultar" para verificar o status atual desta NFe na SEFAZ.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Fechar
          </Button>
          <Button onClick={handleConsultar} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Consultando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Consultar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
