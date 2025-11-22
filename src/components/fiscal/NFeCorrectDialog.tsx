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
import { FileText, Loader2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    // Validação
    if (correcao.trim().length < 15) {
      toast.error("A correção deve ter no mínimo 15 caracteres");
      return;
    }

    if (correcao.trim().length > 1000) {
      toast.error("A correção deve ter no máximo 1000 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('carta-correcao-nfe', {
        body: { 
          nfeId, 
          chaveAcesso, 
          correcao: correcao.trim() 
        }
      });

      if (error) throw error;

      toast.success("Carta de Correção emitida com sucesso!", {
        description: `Protocolo: ${data.protocolo} | Sequência: ${data.sequencia}`
      });

      onOpenChange(false);
      setCorrecao("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error creating CCe:', error);
      toast.error(error.message || "Erro ao emitir carta de correção");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCorrecao("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Carta de Correção Eletrônica - NFe #{nfeNumero}
          </DialogTitle>
          <DialogDescription>
            A CCe permite corrigir erros em campos específicos da NFe após sua autorização.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>O que pode ser corrigido:</strong>
              <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                <li>Dados cadastrais que não necessitem da NFe (CNPJ, Razão Social, etc)</li>
                <li>Data de emissão ou saída</li>
                <li>Observações e informações complementares</li>
              </ul>
              <strong className="block mt-2">O que NÃO pode ser corrigido:</strong>
              <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                <li>Valores, alíquotas e tributos</li>
                <li>Dados dos produtos/serviços</li>
                <li>Data de emissão quando gerar mudança de período de apuração</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="correcao">
              Texto da Correção *
            </Label>
            <Textarea
              id="correcao"
              placeholder="Descreva as correções a serem realizadas (mínimo 15 caracteres, máximo 1000)"
              value={correcao}
              onChange={(e) => setCorrecao(e.target.value)}
              rows={6}
              maxLength={1000}
              disabled={isSubmitting}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              {correcao.length}/1000 caracteres
              {correcao.length < 15 && correcao.length > 0 && (
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
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || correcao.trim().length < 15}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Emitir Carta de Correção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
