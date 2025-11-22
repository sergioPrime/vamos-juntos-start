import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { FileText, AlertTriangle, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NFeCorrectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfeId: string;
  nfeNumero: string;
  onSuccess?: () => void;
}

export default function NFeCorrectDialog({
  open,
  onOpenChange,
  nfeId,
  nfeNumero,
  onSuccess,
}: NFeCorrectDialogProps) {
  const [correcao, setCorrecao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (correcao.length < 15) {
      toast.error("A correção deve ter no mínimo 15 caracteres");
      return;
    }

    if (correcao.length > 1000) {
      toast.error("A correção deve ter no máximo 1000 caracteres");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('carta-correcao-nfe', {
        body: {
          nfeId,
          correcao,
        },
      });

      if (invokeError) throw invokeError;

      if (data.success) {
        toast.success("Carta de Correção enviada com sucesso", {
          description: `Protocolo: ${data.protocolo} - Sequência: ${data.sequencia}`,
        });
        setCorrecao("");
        onOpenChange(false);
        onSuccess?.();
      } else {
        throw new Error(data.error || "Erro ao enviar CC-e");
      }
    } catch (err: any) {
      console.error('Erro ao enviar CC-e:', err);
      const errorMessage = err.message || "Erro ao enviar Carta de Correção";
      setError(errorMessage);
      toast.error("Erro ao enviar CC-e", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Carta de Correção Eletrônica - NFe #{nfeNumero}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm text-foreground">
              <p className="font-medium mb-2">O que pode ser corrigido:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                <li>Erros de digitação em descrições</li>
                <li>Informações adicionais sobre produtos</li>
                <li>Dados de transporte e volumes</li>
                <li>Observações e informações complementares</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm text-foreground">
              <p className="font-medium mb-2">O que NÃO pode ser corrigido:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                <li>Valores de produtos, tributos ou total da nota</li>
                <li>CNPJ/CPF do destinatário ou emitente</li>
                <li>Data de emissão ou saída</li>
                <li>Código de produtos (NCM, CEST)</li>
                <li>Dados que alterem a natureza da operação</li>
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
            <Label htmlFor="correcao">
              Descrição da Correção *
            </Label>
            <Textarea
              id="correcao"
              value={correcao}
              onChange={(e) => setCorrecao(e.target.value)}
              placeholder="Ex: A descrição correta do produto é... / O volume correto é... / Informações adicionais: ..."
              rows={6}
              maxLength={1000}
              disabled={isSubmitting}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mínimo 15 caracteres</span>
              <span>{correcao.length}/1000</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || correcao.length < 15 || correcao.length > 1000}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Enviar CC-e para SEFAZ
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
