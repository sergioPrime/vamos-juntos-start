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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface NFeManifestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfeId: string;
  nfeNumero: string;
  chaveAcesso: string;
  onSuccess?: () => void;
}

type TipoEvento = "ciencia" | "confirmacao" | "desconhecimento" | "nao_realizada" | "";

export default function NFeManifestDialog({
  open,
  onOpenChange,
  nfeId,
  nfeNumero,
  chaveAcesso,
  onSuccess,
}: NFeManifestDialogProps) {
  const [tipoEvento, setTipoEvento] = useState<TipoEvento>("");
  const [justificativa, setJustificativa] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requerJustificativa = tipoEvento === "desconhecimento" || tipoEvento === "nao_realizada";

  const handleSubmit = async () => {
    if (!tipoEvento) {
      toast.error("Selecione o tipo de manifestação");
      return;
    }

    if (requerJustificativa && justificativa.trim().length < 15) {
      toast.error("Justificativa deve ter no mínimo 15 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "manifestacao-destinatario-nfe",
        {
          body: {
            nfeId,
            tipoEvento,
            justificativa: justificativa.trim() || undefined,
          },
        }
      );

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Erro ao registrar manifestação");
      }

      toast.success("Manifestação registrada com sucesso!", {
        description: `Protocolo: ${data.data.protocolo}`,
      });

      onOpenChange(false);
      setTipoEvento("");
      setJustificativa("");
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao registrar manifestação:", error);
      toast.error("Erro ao registrar manifestação", {
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
          <DialogTitle>Manifestação do Destinatário</DialogTitle>
          <DialogDescription>
            Registre a manifestação do destinatário para a NFe nº {nfeNumero}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Chave de Acesso:</strong> {chaveAcesso}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="tipoEvento">Tipo de Manifestação *</Label>
            <Select value={tipoEvento} onValueChange={(value) => setTipoEvento(value as TipoEvento)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de manifestação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ciencia">
                  Ciência da Operação
                </SelectItem>
                <SelectItem value="confirmacao">
                  Confirmação da Operação
                </SelectItem>
                <SelectItem value="desconhecimento">
                  Desconhecimento da Operação
                </SelectItem>
                <SelectItem value="nao_realizada">
                  Operação não Realizada
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipoEvento === "ciencia" && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <AlertDescription>
                <strong>Ciência da Operação:</strong> Confirma que você tomou conhecimento da NFe, sem confirmar ou negar a operação.
              </AlertDescription>
            </Alert>
          )}

          {tipoEvento === "confirmacao" && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                <strong>Confirmação da Operação:</strong> Confirma que a operação foi realizada conforme descrito na NFe.
              </AlertDescription>
            </Alert>
          )}

          {tipoEvento === "desconhecimento" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Desconhecimento da Operação:</strong> Declara que não tem conhecimento da operação descrita na NFe. Justificativa obrigatória.
              </AlertDescription>
            </Alert>
          )}

          {tipoEvento === "nao_realizada" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Operação não Realizada:</strong> Declara que a operação não foi realizada. Justificativa obrigatória.
              </AlertDescription>
            </Alert>
          )}

          {requerJustificativa && (
            <div className="space-y-2">
              <Label htmlFor="justificativa">
                Justificativa * (mínimo 15 caracteres)
              </Label>
              <Textarea
                id="justificativa"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Descreva o motivo da manifestação..."
                rows={4}
                maxLength={255}
              />
              <p className="text-sm text-muted-foreground">
                {justificativa.length}/255 caracteres
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !tipoEvento}>
            {isSubmitting ? "Registrando..." : "Registrar Manifestação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
