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
import { XCircle, Loader2, AlertTriangle } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [justificativa, setJustificativa] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!justificativa || justificativa.trim().length < 15) {
      toast.error("A justificativa deve ter no mínimo 15 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("cancelar-nfe", {
        body: {
          nfeId,
          justificativa: justificativa.trim(),
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`NFe cancelada com sucesso. Protocolo: ${data.protocolo}`);
        setJustificativa("");
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data?.error || "Erro ao cancelar NFe");
      }
    } catch (error: any) {
      console.error("Erro ao cancelar NFe:", error);
      toast.error(error.message || "Erro ao cancelar NFe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Cancelar NFe
          </DialogTitle>
          <DialogDescription>
            Cancelamento da NFe {nfeNumero}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Atenção!</strong> O cancelamento de uma NFe é uma operação
              irreversível. Certifique-se de que realmente deseja prosseguir.
              <p className="mt-2">
                O prazo para cancelamento é de até 24 horas após a autorização.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="justificativa">Justificativa do Cancelamento *</Label>
            <Textarea
              id="justificativa"
              placeholder="Informe o motivo do cancelamento da NFe..."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={4}
              required
              minLength={15}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Mínimo de 15 caracteres. Caracteres: {justificativa.length}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? (
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
