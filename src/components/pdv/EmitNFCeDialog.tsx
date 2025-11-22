import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, Receipt } from 'lucide-react';
import { usePDVNFCe } from '@/hooks/usePDVNFCe';

interface EmitNFCeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleData: any;
  orgId: string;
  onSuccess?: (nfce: any) => void;
}

export function EmitNFCeDialog({
  open,
  onOpenChange,
  saleData,
  orgId,
  onSuccess,
}: EmitNFCeDialogProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [printAfterEmit, setPrintAfterEmit] = useState(true);

  const { emitNFCeFromSale, isEmitting } = usePDVNFCe(orgId);

  const handleEmit = async () => {
    const saleWithCustomer = {
      ...saleData,
      customer: customerName
        ? {
            id: '',
            name: customerName,
            document: customerDocument,
          }
        : undefined,
    };

    emitNFCeFromSale(
      { sale: saleWithCustomer, autoEmit: false },
      {
        onSuccess: (result) => {
          if (result.nfce && onSuccess) {
            onSuccess(result.nfce);
          }
          
          if (printAfterEmit && result.nfce) {
            // TODO: Open print dialog
            console.log('Print NFC-e:', result.nfce.id);
          }

          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Emitir NFC-e
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do consumidor (opcional)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Nome do Cliente</Label>
            <Input
              id="customerName"
              placeholder="Nome (opcional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={isEmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerDocument">CPF/CNPJ</Label>
            <Input
              id="customerDocument"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              value={customerDocument}
              onChange={(e) => setCustomerDocument(e.target.value)}
              disabled={isEmitting}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="printAfterEmit">Imprimir após emissão</Label>
            <Switch
              id="printAfterEmit"
              checked={printAfterEmit}
              onCheckedChange={setPrintAfterEmit}
              disabled={isEmitting}
            />
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-1">
            <div className="text-sm font-medium">Resumo da Venda</div>
            <div className="text-sm text-muted-foreground">
              Itens: {saleData?.items?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Total: R${' '}
              {(saleData?.total || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isEmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleEmit} disabled={isEmitting}>
            {isEmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Emitindo...
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4 mr-2" />
                Emitir NFC-e
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
