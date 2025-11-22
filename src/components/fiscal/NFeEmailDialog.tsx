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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2 } from "lucide-react";

interface NFeEmailDialogProps {
  nfeId: string;
  nfeNumero: string;
  destinatarioEmail?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NFeEmailDialog({
  nfeId,
  nfeNumero,
  destinatarioEmail = "",
  open,
  onOpenChange,
}: NFeEmailDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(destinatarioEmail);
  const [mensagem, setMensagem] = useState(
    "Segue em anexo a Nota Fiscal Eletrônica (NFe) e o DANFE referente à operação realizada."
  );

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("enviar-email-nfe", {
        body: {
          nfeId,
          destinatarioEmail: email,
          mensagemAdicional: mensagem,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Erro ao enviar email");

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal-nfe-emails"] });
      toast({
        title: "Email enviado!",
        description: `NFe ${nfeNumero} enviada para ${email}`,
      });
      onOpenChange(false);
      setMensagem("Segue em anexo a Nota Fiscal Eletrônica (NFe) e o DANFE referente à operação realizada.");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Email inválido",
        description: "Por favor, informe um email válido",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Enviar NFe por Email
            </DialogTitle>
            <DialogDescription>
              Envie a NFe {nfeNumero} e o DANFE por email para o destinatário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do Destinatário *</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensagem">Mensagem Adicional</Label>
              <Textarea
                id="mensagem"
                placeholder="Digite uma mensagem personalizada (opcional)"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Esta mensagem será incluída no corpo do email
              </p>
            </div>

            <div className="rounded-lg bg-muted p-3 space-y-1">
              <p className="text-sm font-medium">Anexos que serão enviados:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• XML da NFe (arquivo digital)</li>
                <li>• DANFE em PDF (documento auxiliar)</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sendEmailMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={sendEmailMutation.isPending}>
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}