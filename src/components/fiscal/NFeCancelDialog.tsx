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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
    if (justificativa.trim().length < 15) {
      toast.error("Justificativa deve ter no mínimo 15 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("cancelar-nfe", {
        body: {
          nfeId,
          justificativa: justificativa.trim(),
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Erro ao cancelar NFe");
      }

      toast.success("NFe cancelada com sucesso!", {
        description: `Protocolo: ${data.data.protocolo}`,
      });

      onOpenChange(false);
      setJustificativa("");
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao cancelar NFe:", error);
      toast.error("Erro ao cancelar NFe", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Cancelar NFe</DialogTitle>
          <DialogDescription>
            Cancele a NFe nº {nfeNumero} informando a justificativa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> O cancelamento de NFe só pode ser feito em até 24 horas após a autorização.
              Esta ação é irreversível.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Chave de Acesso</Label>
            <p className="text-sm text-muted-foreground font-mono">{chaveAcesso}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justificativa">
              Justificativa do Cancelamento * (mínimo 15 caracteres)
            </Label>
            <Textarea
              id="justificativa"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Exemplo: Erro no cadastro do produto, Valor incorreto, etc."
              rows={4}
              maxLength={255}
            />
            <p className="text-sm text-muted-foreground">
              {justificativa.length}/255 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || justificativa.trim().length < 15}
          >
            {isSubmitting ? "Cancelando..." : "Confirmar Cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
