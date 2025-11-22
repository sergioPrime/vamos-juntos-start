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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NFeManifestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfeId: string;
  nfeNumero: string;
  onSuccess?: () => void;
}

export default function NFeManifestDialog({
  open,
  onOpenChange,
  nfeId,
  nfeNumero,
  onSuccess,
}: NFeManifestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [tipoManifestacao, setTipoManifestacao] = useState("");
  const [justificativa, setJustificativa] = useState("");

  const manifestacaoOptions = [
    { value: "ciencia", label: "Ciência da Operação" },
    { value: "confirmacao", label: "Confirmação da Operação" },
    { value: "desconhecimento", label: "Desconhecimento da Operação" },
    { value: "nao_realizada", label: "Operação não Realizada" },
  ];

  const needsJustification = 
    tipoManifestacao === "desconhecimento" || 
    tipoManifestacao === "nao_realizada";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tipoManifestacao) {
      toast.error("Selecione o tipo de manifestação");
      return;
    }

    if (needsJustification && (!justificativa || justificativa.trim().length < 15)) {
      toast.error("A justificativa deve ter no mínimo 15 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "manifestacao-destinatario-nfe",
        {
          body: {
            nfeId,
            tipoManifestacao,
            justificativa: needsJustification ? justificativa.trim() : undefined,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast.success(
          `Manifestação registrada com sucesso. Protocolo: ${data.protocolo}`
        );
        setTipoManifestacao("");
        setJustificativa("");
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data?.error || "Erro ao registrar manifestação");
      }
    } catch (error: any) {
      console.error("Erro ao registrar manifestação:", error);
      toast.error(error.message || "Erro ao registrar manifestação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Manifestação do Destinatário
          </DialogTitle>
          <DialogDescription>
            Registrar manifestação para a NFe {nfeNumero}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              A Manifestação do Destinatário permite confirmar o recebimento ou 
              registrar desconhecimento de uma NFe recebida.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Manifestação *</Label>
            <Select
              value={tipoManifestacao}
              onValueChange={setTipoManifestacao}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                {manifestacaoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsJustification && (
            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa *</Label>
              <Textarea
                id="justificativa"
                placeholder="Informe o motivo da manifestação..."
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
          )}

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
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Registrar Manifestação
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
