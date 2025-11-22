import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { useToast } from "@/hooks/use-toast";
import { XCircle, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NFeCancelDialogProps {
  nfeId: string;
  nfeNumero: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NFeCancelDialog({
  nfeId,
  nfeNumero,
  open,
  onOpenChange,
}: NFeCancelDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [justificativa, setJustificativa] = useState("");

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (justificativa.length < 15) {
        throw new Error("A justificativa deve ter no mínimo 15 caracteres");
      }

      const { data, error } = await supabase.functions.invoke("cancelar-nfe", {
        body: { nfeId, justificativa },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Erro ao cancelar NFe");

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal-nfe"] });
      toast({
        title: "NFe cancelada!",
        description: `A NFe ${nfeNumero} foi cancelada com sucesso.`,
      });
      onOpenChange(false);
      setJustificativa("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar NFe",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cancelMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Cancelar NFe
            </DialogTitle>
            <DialogDescription>
              Cancelamento da NFe {nfeNumero}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção!</strong> O cancelamento de NFe só pode ser realizado em até 24 horas
                após a autorização. Esta ação é irreversível.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="justificativa">
                Justificativa do Cancelamento *
              </Label>
              <Textarea
                id="justificativa"
                placeholder="Digite a justificativa para o cancelamento (mínimo 15 caracteres)"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={4}
                className="resize-none"
                required
                minLength={15}
                maxLength={255}
              />
              <p className="text-xs text-muted-foreground">
                {justificativa.length}/255 caracteres (mínimo 15)
              </p>
            </div>

            <Alert>
              <AlertDescription>
                A justificativa será enviada para a SEFAZ e constará no evento de cancelamento.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={cancelMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={cancelMutation.isPending || justificativa.length < 15}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
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