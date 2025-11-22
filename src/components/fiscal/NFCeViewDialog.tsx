import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Download, Printer, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface NFCeViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfceId: string;
}

export function NFCeViewDialog({ open, onOpenChange, nfceId }: NFCeViewDialogProps) {
  const [nfce, setNfce] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && nfceId) {
      loadNFCe();
    }
  }, [open, nfceId]);

  const loadNFCe = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('nfce')
        .select('*')
        .eq('id', nfceId)
        .single();

      if (error) throw error;
      setNfce(data);
    } catch (error) {
      console.error('Erro ao carregar NFC-e:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading || !nfce) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="text-center py-8">Carregando...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>NFC-e {nfce.numero}/{nfce.serie}</span>
            {getStatusBadge(nfce.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Chave de Acesso */}
          {nfce.chave_acesso && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Chave de Acesso</p>
              <p className="text-xs font-mono break-all">{nfce.chave_acesso}</p>
            </div>
          )}

          {/* Protocolo */}
          {nfce.protocolo_autorizacao && (
            <div>
              <p className="text-sm font-medium">Protocolo de Autorização</p>
              <p className="text-sm text-muted-foreground">{nfce.protocolo_autorizacao}</p>
            </div>
          )}

          {/* Valores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Valor Total</p>
              <p className="text-lg font-bold">R$ {nfce.valor_total?.toFixed(2)}</p>
            </div>
            
            {nfce.destinatario_documento && (
              <div>
                <p className="text-sm font-medium">CPF/CNPJ Cliente</p>
                <p className="text-sm text-muted-foreground">{nfce.destinatario_documento}</p>
              </div>
            )}
          </div>

          {/* QR Code placeholder */}
          {nfce.qr_code && (
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm font-medium mb-2">QR Code</p>
              <div className="h-48 flex items-center justify-center bg-background rounded">
                <p className="text-muted-foreground">QR Code aqui</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download XML
            </Button>
            
            <Button variant="outline" className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir DANFE
            </Button>
            
            <Button variant="outline" className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
