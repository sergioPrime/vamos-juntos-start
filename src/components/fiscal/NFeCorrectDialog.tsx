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
import { FileText, Loader2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NFeCorrectDialogProps {
  nfeId: string;
  nfeNumero: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NFeCorrectDialog({
  nfeId,
  nfeNumero,
  open,
  onOpenChange,
}: NFeCorrectDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [correcao, setCorrecao] = useState("");

  const correctMutation = useMutation({
    mutationFn: async () => {
      if (correcao.length < 15) {
        throw new Error("A correção deve ter no mínimo 15 caracteres");
      }

      const { data, error } = await supabase.functions.invoke("carta-correcao-nfe", {
        body: { nfeId, correcao },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Erro ao emitir CC-e");

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal-nfe-cce"] });
      toast({
        title: "CC-e emitida!",
        description: `Carta de Correção da NFe ${nfeNumero} emitida com sucesso.`,
      });
      onOpenChange(false);
      setCorrecao("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao emitir CC-e",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    correctMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Carta de Correção Eletrônica (CC-e)
            </DialogTitle>
            <DialogDescription>
              Emitir correção para a NFe {nfeNumero}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>O que pode ser corrigido:</strong>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  <li>Dados cadastrais que não exigem rejeição da NFe</li>
                  <li>Erros de digitação em descrição de mercadorias</li>
                  <li>Data de emissão ou de saída</li>
                  <li>Outros dados que não alteram valores ou impostos</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertDescription>
                <strong>NÃO pode ser corrigido:</strong>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  <li>Valores de operação ou prestação</li>
                  <li>Correção de dados cadastrais que implique mudança do remetente ou destinatário</li>
                  <li>Data de emissão ou saída que implique em período diferente de apuração</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="correcao">
                Texto da Correção *
              </Label>
              <Textarea
                id="correcao"
                placeholder="Descreva a correção a ser feita (mínimo 15 caracteres)"
                value={correcao}
                onChange={(e) => setCorrecao(e.target.value)}
                rows={6}
                className="resize-none"
                required
                minLength={15}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                {correcao.length}/1000 caracteres (mínimo 15)
              </p>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                A CC-e não substitui a NFe original. Ela complementa as informações prestadas,
                servindo como um evento vinculado à nota fiscal.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={correctMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={correctMutation.isPending || correcao.length < 15}
            >
              {correctMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Emitindo...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Emitir CC-e
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}