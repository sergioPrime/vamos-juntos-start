import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNFCe } from '@/hooks/useNFCe';
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface NFCeStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfceId: string;
}

export function NFCeStatusDialog({ open, onOpenChange, nfceId }: NFCeStatusDialogProps) {
  const { queryNFCeStatus } = useNFCe();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && nfceId) {
      handleQuery();
    }
  }, [open, nfceId]);

  const handleQuery = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await queryNFCeStatus(nfceId);
      
      if (result.success) {
        setStatus(result.data);
      } else {
        setError(result.message || 'Erro ao consultar status');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao consultar status');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (statusValue: string) => {
    switch (statusValue) {
      case 'autorizada':
        return (
          <Badge variant="default" className="gap-1 bg-success">
            <CheckCircle className="h-3 w-3" />
            Autorizada
          </Badge>
        );
      case 'cancelada':
        return (
          <Badge variant="secondary" className="gap-1">
            <XCircle className="h-3 w-3" />
            Cancelada
          </Badge>
        );
      case 'rejeitada':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Rejeitada
          </Badge>
        );
      default:
        return <Badge variant="outline">{statusValue}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Consultar Status NFC-e</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="font-medium">Consultando SEFAZ...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Aguarde enquanto consultamos o status
            </p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button onClick={handleQuery} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        ) : status ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <span className="font-medium">Status Atual</span>
              {getStatusBadge(status.status)}
            </div>

            {status.protocolo && (
              <div>
                <p className="text-sm font-medium mb-1">Protocolo</p>
                <p className="text-sm text-muted-foreground font-mono">{status.protocolo}</p>
              </div>
            )}

            {status.data_autorizacao && (
              <div>
                <p className="text-sm font-medium mb-1">Data de Autorização</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(status.data_autorizacao), 'dd/MM/yyyy HH:mm:ss')}
                </p>
              </div>
            )}

            {status.data_cancelamento && (
              <div>
                <p className="text-sm font-medium mb-1">Data de Cancelamento</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(status.data_cancelamento), 'dd/MM/yyyy HH:mm:ss')}
                </p>
              </div>
            )}

            {status.motivo && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Motivo</p>
                <p className="text-sm text-muted-foreground">{status.motivo}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleQuery} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={() => onOpenChange(false)} className="flex-1">
                Fechar
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
