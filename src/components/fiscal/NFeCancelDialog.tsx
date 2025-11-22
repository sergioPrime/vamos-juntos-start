import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NFeCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfeId: string;
  nfeNumero: string;
  onSuccess?: () => void;
}

export default function NFeCancelDialog({
  open,
  onOpenChange,
  nfeId,
  nfeNumero,
  onSuccess,
}: NFeCancelDialogProps) {
  const [justificativa, setJustificativa] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (justificativa.length < 15) {
      toast.error("A justificativa deve ter no mínimo 15 caracteres");
      return;
    }

    if (justificativa.length > 255) {
      toast.error("A justificativa deve ter no máximo 255 caracteres");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('cancelar-nfe', {
        body: {
          nfeId,
          justificativa,
        },
      });

      if (invokeError) throw invokeError;

      if (data.success) {
        toast.success("NFe cancelada com sucesso na SEFAZ", {
          description: `Protocolo: ${data.protocolo}`,
        });
        setJustificativa("");
        onOpenChange(false);
        onSuccess?.();
      } else {
        throw new Error(data.error || "Erro ao cancelar NFe");
      }
    } catch (err: any) {
      console.error('Erro ao cancelar NFe:', err);
      const errorMessage = err.message || "Erro ao cancelar NFe";
      setError(errorMessage);
      toast.error("Erro ao cancelar NFe", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Cancelar NFe #{nfeNumero}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm text-foreground">
              <p className="font-medium mb-2">Atenção:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>O cancelamento é <strong>irreversível</strong></li>
                <li>Prazo máximo: <strong>24 horas</strong> após autorização</li>
                <li>Justificativa: <strong>15 a 255 caracteres</strong></li>
                <li>Será enviado para a SEFAZ</li>
              </ul>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="justificativa">
              Justificativa do Cancelamento *
            </Label>
            <Textarea
              id="justificativa"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Ex: Emissão em duplicidade, erro no valor da mercadoria, cliente desistiu da compra..."
              rows={5}
              maxLength={255}
              disabled={isSubmitting}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mínimo 15 caracteres</span>
              <span>{justificativa.length}/255</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isSubmitting || justificativa.length < 15 || justificativa.length > 255}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirmar Cancelamento
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
