import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NFeAuthorizeButtonProps {
  nfeId: string;
  currentStatus: string;
  onSuccess?: () => void;
}

export function NFeAuthorizeButton({ nfeId, currentStatus, onSuccess }: NFeAuthorizeButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);

  const authorizeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("autorizar-nfe", {
        body: { nfeId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Erro ao autorizar NFe");

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fiscal-nfe"] });
      toast({
        title: "NFe autorizada!",
        description: `Chave de acesso: ${data.data.chave_acesso}`,
      });
      onSuccess?.();
      setShowConfirm(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao autorizar NFe",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Só pode autorizar se estiver pendente ou rejeitada
  const canAuthorize = currentStatus === "pendente" || currentStatus === "rejeitada";

  if (!canAuthorize) {
    return null;
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={authorizeMutation.isPending}
      >
        {authorizeMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Autorizando...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Autorizar NFe
          </>
        )}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Autorizar NFe na SEFAZ?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação enviará a NFe para autorização na SEFAZ. Após autorizada, a nota não poderá
              mais ser alterada, apenas cancelada (dentro do prazo) ou corrigida com carta de correção.
              <br /><br />
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => authorizeMutation.mutate()}>
              Sim, autorizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}