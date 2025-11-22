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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";

interface NFeInutilizacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function NFeInutilizacaoDialog({
  open,
  onOpenChange,
  onSuccess,
}: NFeInutilizacaoDialogProps) {
  const { currentOrg } = useOrganization();
  const [serie, setSerie] = useState("1");
  const [numeroInicial, setNumeroInicial] = useState("");
  const [numeroFinal, setNumeroFinal] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!numeroInicial || !numeroFinal) {
      toast.error("Informe os números inicial e final");
      return;
    }

    const numInicial = parseInt(numeroInicial);
    const numFinal = parseInt(numeroFinal);

    if (isNaN(numInicial) || isNaN(numFinal)) {
      toast.error("Números devem ser valores numéricos");
      return;
    }

    if (numInicial > numFinal) {
      toast.error("Número inicial não pode ser maior que o número final");
      return;
    }

    if (numFinal - numInicial > 1000) {
      toast.error("Não é permitido inutilizar mais de 1000 números por vez");
      return;
    }

    if (justificativa.trim().length < 15) {
      toast.error("Justificativa deve ter no mínimo 15 caracteres");
      return;
    }

    if (!currentOrg?.id) {
      toast.error("Organização não identificada");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "inutilizar-numeracao-nfe",
        {
          body: {
            serie,
            numeroInicial: numInicial,
            numeroFinal: numFinal,
            justificativa: justificativa.trim(),
            orgId: currentOrg.id,
          },
        }
      );

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Erro ao inutilizar numeração");
      }

      toast.success("Numeração inutilizada com sucesso!", {
        description: `Protocolo: ${data.data.protocolo}`,
      });

      onOpenChange(false);
      setSerie("1");
      setNumeroInicial("");
      setNumeroFinal("");
      setJustificativa("");
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao inutilizar numeração:", error);
      toast.error("Erro ao inutilizar numeração", {
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
          <DialogTitle>Inutilizar Numeração de NFe</DialogTitle>
          <DialogDescription>
            Inutilize números de NFe que não foram utilizados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Quando usar:</strong> Utilize esta função quando houver uma quebra na sequência 
              de numeração e você precisa inutilizar os números não utilizados na SEFAZ.
              <br /><br />
              <strong>Exemplo:</strong> Se você emitiu a NFe 100 e a próxima foi a 105, 
              deve inutilizar os números 101 a 104.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Esta ação é irreversível. Os números inutilizados 
              não poderão mais ser utilizados para emissão de NFe.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serie">Série *</Label>
              <Input
                id="serie"
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                placeholder="1"
                maxLength={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroInicial">Número Inicial *</Label>
              <Input
                id="numeroInicial"
                type="number"
                value={numeroInicial}
                onChange={(e) => setNumeroInicial(e.target.value)}
                placeholder="101"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroFinal">Número Final *</Label>
              <Input
                id="numeroFinal"
                type="number"
                value={numeroFinal}
                onChange={(e) => setNumeroFinal(e.target.value)}
                placeholder="104"
                min="1"
              />
            </div>
          </div>

          {numeroInicial && numeroFinal && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Serão inutilizados <strong>{parseInt(numeroFinal) - parseInt(numeroInicial) + 1}</strong> número(s) 
                da série <strong>{serie}</strong>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="justificativa">
              Justificativa * (mínimo 15 caracteres)
            </Label>
            <Textarea
              id="justificativa"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Exemplo: Erro no sistema causou quebra na sequência de numeração..."
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
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !numeroInicial ||
              !numeroFinal ||
              justificativa.trim().length < 15
            }
          >
            {isSubmitting ? "Inutilizando..." : "Inutilizar Numeração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
