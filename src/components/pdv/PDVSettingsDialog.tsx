import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePDVSettings } from '@/hooks/usePDVSettings';

interface PDVSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}

export function PDVSettingsDialog({ open, onOpenChange, orgId }: PDVSettingsDialogProps) {
  const { settings, updateSettings } = usePDVSettings(orgId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações do PDV - NFC-e</DialogTitle>
          <DialogDescription>
            Configure a emissão de NFC-e no ponto de venda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-emit">Emissão Automática</Label>
              <p className="text-sm text-muted-foreground">
                Emitir NFC-e automaticamente ao finalizar venda
              </p>
            </div>
            <Switch
              id="auto-emit"
              checked={settings.auto_emit_nfce}
              onCheckedChange={(checked) =>
                updateSettings({ auto_emit_nfce: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="print-after">Imprimir Após Emissão</Label>
              <p className="text-sm text-muted-foreground">
                Imprimir DANFE automaticamente após autorização
              </p>
            </div>
            <Switch
              id="print-after"
              checked={settings.print_after_emit}
              onCheckedChange={(checked) =>
                updateSettings({ print_after_emit: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="require-customer">Exigir Dados do Cliente</Label>
              <p className="text-sm text-muted-foreground">
                Solicitar CPF/CNPJ obrigatoriamente
              </p>
            </div>
            <Switch
              id="require-customer"
              checked={settings.require_customer_data}
              onCheckedChange={(checked) =>
                updateSettings({ require_customer_data: checked })
              }
            />
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Dica:</strong> Em modo contingência, as NFC-e serão armazenadas
              automaticamente e transmitidas quando a conexão for restabelecida.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
