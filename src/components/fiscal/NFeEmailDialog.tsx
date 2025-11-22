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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";

interface NFeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfeId: string;
  nfeNumero: string;
  clienteEmail?: string;
  onSuccess?: () => void;
}

export default function NFeEmailDialog({
  open,
  onOpenChange,
  nfeId,
  nfeNumero,
  clienteEmail,
  onSuccess,
}: NFeEmailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(clienteEmail || "");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Por favor, informe um email válido");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("enviar-email-nfe", {
        body: {
          nfeId,
          emailDestinatario: email,
          emailSubject: assunto || undefined,
          emailBody: mensagem || undefined,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Email enviado com sucesso para ${email}`);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(data?.error || "Erro ao enviar email");
      }
    } catch (error: any) {
      console.error("Erro ao enviar email:", error);
      toast.error(error.message || "Erro ao enviar email da NFe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar NFe por Email
          </DialogTitle>
          <DialogDescription>
            Envie o XML e DANFE da NFe {nfeNumero} por email
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Destinatário *</Label>
            <Input
              id="email"
              type="email"
              placeholder="cliente@exemplo.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              O XML e DANFE serão enviados como anexo
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assunto">Assunto (opcional)</Label>
            <Input
              id="assunto"
              placeholder={`NFe ${nfeNumero}`}
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem Adicional (opcional)</Label>
            <Textarea
              id="mensagem"
              placeholder="Adicione uma mensagem personalizada ao email..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Se não informado, será usada a mensagem padrão
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
                  <Mail className="mr-2 h-4 w-4" />
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
