import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePDVNFCe } from '@/hooks/usePDVNFCe';

interface NFCeAutoEmissionProps {
  orgId: string;
  enabled: boolean;
  onSaleComplete?: (saleData: any) => void;
}

/**
 * Component for handling automatic NFC-e emission
 * Listens to sale completion events and emits NFC-e automatically
 */
export function NFCeAutoEmission({ orgId, enabled, onSaleComplete }: NFCeAutoEmissionProps) {
  const { toast } = useToast();
  const { emitNFCeFromSale } = usePDVNFCe(orgId);

  useEffect(() => {
    if (!enabled) return;

    // Listen for sale completion events
    const handleSaleComplete = (event: CustomEvent) => {
      const saleData = event.detail;
      
      // Emit NFC-e automatically
      emitNFCeFromSale(
        { sale: saleData, autoEmit: true },
        {
          onSuccess: (result) => {
            if (onSaleComplete) {
              onSaleComplete(saleData);
            }

            if (!result.contingency) {
              toast({
                title: "Venda finalizada",
                description: `NFC-e ${result.nfce?.numero} emitida automaticamente`,
              });
            }
          },
          onError: (error) => {
            console.error('Auto emission error:', error);
            toast({
              title: "Erro na emissão automática",
              description: "A venda foi concluída mas a NFC-e não foi emitida. Emita manualmente.",
              variant: "destructive",
            });
          },
        }
      );
    };

    // Add event listener
    window.addEventListener('pdv-sale-complete', handleSaleComplete as EventListener);

    return () => {
      window.removeEventListener('pdv-sale-complete', handleSaleComplete as EventListener);
    };
  }, [enabled, emitNFCeFromSale, onSaleComplete, orgId, toast]);

  return null; // This is a logic-only component
}
