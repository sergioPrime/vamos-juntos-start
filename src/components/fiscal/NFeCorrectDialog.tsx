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
import { FileText, Loader2, AlertCircle } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [correcao, setCorrecao] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!correcao || correcao.trim().length < 15) {
      toast.error("A correção deve ter no mínimo 15 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("carta-correcao-nfe", {
        body: {
          nfeId,
          correcao: correcao.trim(),
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(
          `Carta de Correção registrada com sucesso. Protocolo: ${data.protocolo}`
        );
        setCorrecao("");
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data?.error || "Erro ao registrar Carta de Correção");
      }
    } catch (error: any) {
      console.error("Erro ao registrar Carta de Correção:", error);
      toast.error(error.message || "Erro ao registrar Carta de Correção");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Carta de Correção Eletrônica (CC-e)
          </DialogTitle>
          <DialogDescription>
            Registrar correção para a NFe {nfeNumero}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Importante:</strong> A Carta de Correção não pode ser usada para
              corrigir valores, impostos, dados do destinatário, data de emissão ou
              produtos. Use apenas para erros de texto e informações complementares.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="correcao">Descrição da Correção *</Label>
            <Textarea
              id="correcao"
              placeholder="Descreva detalhadamente o erro e a correção..."
              value={correcao}
              onChange={(e) => setCorrecao(e.target.value)}
              rows={6}
              required
              minLength={15}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Mínimo de 15 caracteres. Caracteres: {correcao.length}
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Registrar Correção
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
