import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface NFCeViewDialogProps {
  nfce: any;
  open: boolean;
  onClose: () => void;
}

export function NFCeViewDialog({ nfce, open, onClose }: NFCeViewDialogProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      autorizada: "default",
      processando: "secondary",
      rejeitada: "destructive",
      cancelada: "outline",
    };

    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            NFC-e #{nfce.numero}
            {getStatusBadge(nfce.status)}
          </DialogTitle>
          <DialogDescription>
            Chave de Acesso: {nfce.chave_acesso || "Não disponível"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Informações Gerais</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Número:</span>
                <p className="font-medium">{nfce.numero}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Série:</span>
                <p className="font-medium">{nfce.serie}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Data de Emissão:</span>
                <p className="font-medium">
                  {nfce.data_emissao && format(new Date(nfce.data_emissao), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Protocolo:</span>
                <p className="font-medium">{nfce.protocolo_autorizacao || "-"}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">Destinatário</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <span className="text-muted-foreground">Nome:</span>
                <p className="font-medium">{nfce.destinatario_nome}</p>
              </div>
              <div>
                <span className="text-muted-foreground">CPF/CNPJ:</span>
                <p className="font-medium">{nfce.destinatario_documento || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">E-mail:</span>
                <p className="font-medium">{nfce.destinatario_email || "-"}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">Valores</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Valor dos Produtos:</span>
                <p className="font-medium">{formatCurrency(nfce.valor_produtos || 0)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Valor do Desconto:</span>
                <p className="font-medium">{formatCurrency(nfce.valor_desconto || 0)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Valor Total:</span>
                <p className="font-bold text-lg">{formatCurrency(nfce.valor_total || 0)}</p>
              </div>
            </div>
          </div>

          {nfce.observacoes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Observações</h3>
                <p className="text-sm text-muted-foreground">{nfce.observacoes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
