import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DANFENFCe } from './DANFENFCe';
import { useNFCePrint } from '@/hooks/useNFCePrint';
import { Printer, FileDown, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NFCePrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfce: any;
}

export function NFCePrintDialog({ open, onOpenChange, nfce }: NFCePrintDialogProps) {
  const { componentRef, handlePrint, generatePDF, sendToThermalPrinter } = useNFCePrint();
  const [viewMode, setViewMode] = useState<'preview' | 'print'>('preview');

  if (!nfce) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>DANFE NFC-e - Nº {nfce.numero}</DialogTitle>
          <DialogDescription>
            Visualizar e imprimir o Documento Auxiliar da NFC-e
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={viewMode === 'preview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('preview')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePrint()}
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={generatePDF}
          >
            <FileDown className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>

        <ScrollArea className="h-[60vh] border rounded-lg p-4 bg-muted/30">
          <div className="flex justify-center">
            <DANFENFCe ref={componentRef} nfce={nfce} />
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
