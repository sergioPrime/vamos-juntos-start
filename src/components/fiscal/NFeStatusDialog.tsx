import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { RefreshCw, Loader2, CheckCircle, XCircle, Clock, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface NFeStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfeId: string;
  nfeNumero: string;
  currentStatus: string;
  onSuccess?: () => void;
}

export default function NFeStatusDialog({
  open,
  onOpenChange,
  nfeId,
  nfeNumero,
  currentStatus,
  onSuccess,
}: NFeStatusDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConsultar = async () => {
    setIsLoading(true);
    setError(null);
    setStatusData(null);
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('consultar-status-nfe', {
        body: { nfeId },
      });

      if (invokeError) throw invokeError;

      if (data.success) {
        setStatusData(data.data);
        
        // Se o status mudou, notificar
        if (data.data.statusNFe !== currentStatus) {
          toast.success("Status atualizado", {
            description: `NFe agora está: ${getStatusLabel(data.data.statusNFe)}`,
          });
          onSuccess?.();
        } else {
          toast.success("Consulta realizada com sucesso");
        }
      } else {
        throw new Error(data.error || "Erro ao consultar status");
      }
    } catch (err: any) {
      console.error('Erro ao consultar status:', err);
      const errorMessage = err.message || "Erro ao consultar status na SEFAZ";
      setError(errorMessage);
      toast.error("Erro na consulta", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'autorizada':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelada':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pendente':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejeitada':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      autorizada: 'Autorizada',
      cancelada: 'Cancelada',
      pendente: 'Em Processamento',
      rejeitada: 'Rejeitada',
      nao_encontrada: 'Não Encontrada',
    };
    return labels[status] || status;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'autorizada':
        return 'default';
      case 'cancelada':
        return 'destructive';
      case 'pendente':
        return 'secondary';
      case 'rejeitada':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Consultar Status na SEFAZ - NFe #{nfeNumero}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm">
              Consulta o status atual da NFe diretamente na SEFAZ. Útil para verificar autorizações, 
              cancelamentos e eventuais mudanças de status.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {statusData && (
            <div className="space-y-4 rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(statusData.statusNFe)}
                  <div>
                    <p className="font-medium">Status Atual</p>
                    <Badge variant={getStatusBadgeVariant(statusData.statusNFe)} className="mt-1">
                      {getStatusLabel(statusData.statusNFe)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Código SEFAZ</p>
                  <p className="font-mono text-sm font-medium">{statusData.cStat}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mensagem da SEFAZ</p>
                  <p className="text-sm">{statusData.xMotivo}</p>
                </div>

                {statusData.protocolo && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Protocolo de Autorização</p>
                    <p className="font-mono text-sm">{statusData.protocolo}</p>
                  </div>
                )}

                {statusData.dhRecbto && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data/Hora Recebimento</p>
                    <p className="text-sm">
                      {new Date(statusData.dhRecbto).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}

                {statusData.protocoloCancelamento && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Protocolo de Cancelamento</p>
                      <p className="font-mono text-sm">{statusData.protocoloCancelamento}</p>
                    </div>
                    {statusData.dhEventoCancelamento && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Data/Hora Cancelamento</p>
                        <p className="text-sm">
                          {new Date(statusData.dhEventoCancelamento).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {statusData.motivoCancelamento && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Motivo do Cancelamento</p>
                        <p className="text-sm">{statusData.motivoCancelamento}</p>
                      </div>
                    )}
                  </>
                )}

                {statusData.numeroLote && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Número do Lote</p>
                    <p className="font-mono text-sm">{statusData.numeroLote}</p>
                  </div>
                )}

                {statusData.digest && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Digest Value</p>
                    <p className="font-mono text-xs break-all">{statusData.digest}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Fechar
            </Button>
            <Button
              onClick={handleConsultar}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {statusData ? 'Consultar Novamente' : 'Consultar Status'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
