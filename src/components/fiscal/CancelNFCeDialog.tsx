import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNFCe } from '@/hooks/useNFCe';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { differenceInHours } from 'date-fns';

interface CancelNFCeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfceId: string;
  onSuccess?: () => void;
}

export function CancelNFCeDialog({ open, onOpenChange, nfceId, onSuccess }: CancelNFCeDialogProps) {
  const { cancelNFCe } = useNFCe();
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [state, setState] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm');
  const [errorMessage, setErrorMessage] = useState('');
  const [canCancel, setCanCancel] = useState(true);
  const [nfce, setNfce] = useState<any>(null);

  useEffect(() => {
    if (open && nfceId) {
      checkCancellationDeadline();
    } else {
      resetDialog();
    }
  }, [open, nfceId]);

  const checkCancellationDeadline = async () => {
    try {
      const { data, error } = await supabase
        .from('nfce')
        .select('data_autorizacao')
        .eq('id', nfceId)
        .single();

      if (error) throw error;
      setNfce(data);

      if (data.data_autorizacao) {
        const hoursSinceAuth = differenceInHours(new Date(), new Date(data.data_autorizacao));
        setCanCancel(hoursSinceAuth < 24);
      }
    } catch (error) {
      console.error('Erro ao verificar prazo:', error);
    }
  };

  const resetDialog = () => {
    setReason('');
    setState('confirm');
    setErrorMessage('');
    setIsProcessing(false);
  };

  const handleCancel = async () => {
    if (reason.length < 15) return;

    setIsProcessing(true);
    setState('processing');

    try {
      const result = await cancelNFCe(nfceId, reason);
      
      if (result.success) {
        setState('success');
        setTimeout(() => {
          onSuccess?.();
          onOpenChange(false);
        }, 2000);
      } else {
        setState('error');
        setErrorMessage(result.message || 'Erro ao cancelar NFC-e');
      }
    } catch (error: any) {
      setState('error');
      setErrorMessage(error.message || 'Erro ao cancelar NFC-e');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar NFC-e</DialogTitle>
          <DialogDescription>
            O cancelamento é irreversível e deve ser feito em até 24 horas após a autorização.
          </DialogDescription>
        </DialogHeader>

        {!canCancel ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Prazo de 24 horas excedido. Não é mais possível cancelar esta NFC-e.
            </AlertDescription>
          </Alert>
        ) : state === 'confirm' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">
                Motivo do Cancelamento (mínimo 15 caracteres)
              </Label>
              <Textarea
                id="reason"
                placeholder="Informe o motivo do cancelamento..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                minLength={15}
                maxLength={255}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                {reason.length}/255 caracteres
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={handleCancel}
                disabled={reason.length < 15}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar NFC-e
              </Button>
            </div>
          </div>
        ) : state === 'processing' ? (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="font-medium">Cancelando NFC-e...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Aguarde enquanto processamos o cancelamento
            </p>
          </div>
        ) : state === 'success' ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
            <p className="font-medium">NFC-e cancelada com sucesso!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>

            <Button onClick={() => setState('confirm')} className="w-full">
              Tentar Novamente
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
