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
import { RefreshCw, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface NFeStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfeId: string;
  nfeNumero: string;
  onSuccess?: () => void;
}

export default function NFeStatusDialog({
  open,
  onOpenChange,
  nfeId,
  nfeNumero,
  onSuccess,
}: NFeStatusDialogProps) {
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);

  const handleConsultar = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("consultar-status-nfe", {
        body: {
          nfeId,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setStatusData(data);
        toast.success("Status consultado com sucesso");
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data?.error || "Erro ao consultar status");
      }
    } catch (error: any) {
      console.error("Erro ao consultar status:", error);
      toast.error(error.message || "Erro ao consultar status da NFe");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "autorizada":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelada":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pendente":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "rejeitada":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "autorizada":
        return "default";
      case "cancelada":
        return "destructive";
      case "pendente":
        return "secondary";
      case "rejeitada":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Consultar Status na SEFAZ
          </DialogTitle>
          <DialogDescription>NFe {nfeNumero}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!statusData ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Clique no botão abaixo para consultar o status atual da NFe na SEFAZ
              </p>
              <Button onClick={handleConsultar} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Consultar Status
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(statusData.sefaz.status)}
                    <Badge variant={getStatusBadgeVariant(statusData.sefaz.status) as any}>
                      {statusData.sefaz.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Código:</span>
                  <span className="text-sm">{statusData.sefaz.codigo_status}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Mensagem:</span>
                  <p className="text-sm text-muted-foreground">
                    {statusData.sefaz.mensagem}
                  </p>
                </div>

                {statusData.sefaz.protocolo && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Protocolo:</span>
                    <span className="text-sm font-mono">
                      {statusData.sefaz.protocolo}
                    </span>
                  </div>
                )}
              </div>

              {statusData.eventos && statusData.eventos.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Eventos:</h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {statusData.eventos.map((evento: any) => (
                        <div
                          key={evento.id}
                          className="p-3 border rounded-lg space-y-1"
                        >
                          <Badge variant="outline">
                            {evento.tipo_evento.replace(/_/g, " ").toUpperCase()}
                          </Badge>
                          <p className="text-sm">{evento.descricao}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={handleConsultar}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar Status
              </Button>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
