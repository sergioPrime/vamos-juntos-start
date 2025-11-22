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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NFeCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfeId: string;
  nfeNumero: string;
  chaveAcesso: string;
  onSuccess?: () => void;
}

export default function NFeCancelDialog({
  open,
  onOpenChange,
  nfeId,
  nfeNumero,
  chaveAcesso,
  onSuccess,
}: NFeCancelDialogProps) {
  const [justificativa, setJustificativa] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validação
    if (justificativa.trim().length < 15) {
      toast.error("A justificativa deve ter no mínimo 15 caracteres");
      return;
    }

    if (justificativa.trim().length > 255) {
      toast.error("A justificativa deve ter no máximo 255 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('cancelar-nfe', {
        body: { 
          nfeId, 
          chaveAcesso, 
          justificativa: justificativa.trim() 
        }
      });

      if (error) throw error;

      toast.success("NFe cancelada com sucesso!", {
        description: `Protocolo: ${data.protocolo}`
      });

      onOpenChange(false);
      setJustificativa("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error canceling NFe:', error);
      toast.error(error.message || "Erro ao cancelar NFe", {
        description: "Verifique se a NFe está autorizada e dentro do prazo de 24h"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setJustificativa("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancelar NFe #{nfeNumero}
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. A NFe será cancelada na SEFAZ e não poderá mais ser utilizada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> O cancelamento só pode ser feito em até 24 horas após a autorização.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="justificativa">
              Justificativa do Cancelamento *
            </Label>
            <Textarea
              id="justificativa"
              placeholder="Digite o motivo do cancelamento (mínimo 15 caracteres, máximo 255)"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={4}
              maxLength={255}
              disabled={isSubmitting}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              {justificativa.length}/255 caracteres
              {justificativa.length < 15 && justificativa.length > 0 && (
                <span className="text-destructive ml-2">
                  (mínimo 15 caracteres)
                </span>
              )}
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-1">
            <p className="text-sm font-medium">Chave de Acesso:</p>
            <p className="text-xs font-mono text-muted-foreground break-all">
              {chaveAcesso}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Voltar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || justificativa.trim().length < 15}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
