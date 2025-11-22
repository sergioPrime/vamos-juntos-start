import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Server, Send } from "lucide-react";
import { useNFCeContingency } from "@/hooks/useNFCeContingency";
import { NFCeContingencyQueue } from "./NFCeContingencyQueue";

export function NFCeContingencyPanel() {
  const {
    contingencyActive,
    queuedNFCes,
    activateContingency,
    deactivateContingency,
    transmitQueue,
  } = useNFCeContingency();

  const [reason, setReason] = useState("");

  const handleActivate = () => {
    if (!reason.trim()) return;
    activateContingency.mutate(reason);
    setReason("");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Status da Contingência</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie o modo de contingência offline para NFC-e
            </p>
          </div>
          {contingencyActive ? (
            <Badge variant="destructive" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Contingência Ativa
            </Badge>
          ) : (
            <Badge variant="default" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Online
            </Badge>
          )}
        </div>

        {contingencyActive ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20">
              <p className="text-sm">
                O sistema está em modo de contingência. As NFC-e estão sendo armazenadas localmente
                e serão transmitidas quando o sistema voltar ao normal.
              </p>
            </div>
            <Button
              onClick={() => deactivateContingency.mutate()}
              disabled={deactivateContingency.isPending}
              variant="outline"
            >
              Desativar Contingência
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Motivo da Contingência</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Problemas de conexão com SEFAZ"
                className="mt-2"
              />
            </div>
            <Button
              onClick={handleActivate}
              disabled={!reason.trim() || activateContingency.isPending}
              variant="destructive"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Ativar Contingência
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Server className="h-5 w-5" />
              Fila de Transmissão
            </h3>
            <p className="text-sm text-muted-foreground">
              {queuedNFCes?.length || 0} NFC-e(s) aguardando transmissão
            </p>
          </div>
          {queuedNFCes && queuedNFCes.length > 0 && (
            <Button
              onClick={() => transmitQueue.mutate()}
              disabled={transmitQueue.isPending}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Transmitir Todas
            </Button>
          )}
        </div>

        <NFCeContingencyQueue />
      </Card>
    </div>
  );
}
