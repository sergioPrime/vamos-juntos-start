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
import { Info } from "lucide-react";

interface NFeCorrectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfeId: string;
  nfeNumero: string;
  chaveAcesso: string;
  onSuccess?: () => void;
}

export default function NFeCorrectDialog({
  open,
  onOpenChange,
  nfeId,
  nfeNumero,
  chaveAcesso,
  onSuccess,
}: NFeCorrectDialogProps) {
  const [correcao, setCorrecao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (correcao.trim().length < 15) {
      toast.error("Correção deve ter no mínimo 15 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "carta-correcao-nfe",
        {
          body: {
            nfeId,
            correcao: correcao.trim(),
          },
        }
      );

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Erro ao registrar Carta de Correção");
      }

      toast.success("Carta de Correção registrada com sucesso!", {
        description: `Protocolo: ${data.data.protocolo}`,
      });

      onOpenChange(false);
      setCorrecao("");
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao registrar CC-e:", error);
      toast.error("Erro ao registrar Carta de Correção", {
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
          <DialogTitle>Carta de Correção Eletrônica (CC-e)</DialogTitle>
          <DialogDescription>
            Corrija erros na NFe nº {nfeNumero}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>O que PODE ser corrigido:</strong>
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>Dados cadastrais que não influenciem no valor do imposto</li>
                <li>Endereço do destinatário</li>
                <li>Peso/volumes transportados</li>
                <li>Correções ortográficas</li>
              </ul>
              <strong className="block mt-3">O que NÃO PODE ser corrigido:</strong>
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>Valores de produtos, impostos ou totais</li>
                <li>CNPJ/CPF do destinatário</li>
                <li>Data de emissão</li>
                <li>Destino da operação</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Chave de Acesso</Label>
            <p className="text-sm text-muted-foreground font-mono">{chaveAcesso}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="correcao">
              Descrição da Correção * (mínimo 15 caracteres)
            </Label>
            <Textarea
              id="correcao"
              value={correcao}
              onChange={(e) => setCorrecao(e.target.value)}
              placeholder="Exemplo: Corrigir endereço do destinatário de Rua A para Rua B..."
              rows={5}
              maxLength={1000}
            />
            <p className="text-sm text-muted-foreground">
              {correcao.length}/1000 caracteres
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
            onClick={handleSubmit}
            disabled={isSubmitting || correcao.trim().length < 15}
          >
            {isSubmitting ? "Registrando..." : "Registrar Correção"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
