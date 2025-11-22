import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useNFCe } from '@/hooks/useNFCe';
import { useContingencyMode } from '@/hooks/useContingencyMode';

interface PDVSale {
  items: Array<{
    product_id: string;
    product_name: string;
    product_sku: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  customer?: {
    id: string;
    name: string;
    document: string;
  };
  payment_method: string;
  subtotal: number;
  discount: number;
  total: number;
}

/**
 * Hook for integrating NFC-e with PDV
 * Handles automatic emission after sale
 */
export function usePDVNFCe(orgId: string) {
  const { toast } = useToast();
  const { emitNFCe } = useNFCe(orgId);
  const { isContingencyActive, addToQueue } = useContingencyMode(orgId);

  // Emit NFC-e from PDV sale
  const emitNFCeFromSale = useMutation({
    mutationFn: async ({ sale, autoEmit = false }: { sale: PDVSale; autoEmit?: boolean }) => {
      // Build NFC-e data from sale
      const nfceData = {
        // Customer data
        consumidor_nome: sale.customer?.name || null,
        consumidor_documento: sale.customer?.document || null,
        consumidor_tipo: sale.customer?.document 
          ? (sale.customer.document.length === 11 ? 'cpf' : 'cnpj')
          : null,

        // Items
        items: sale.items.map((item, index) => ({
          numero_item: index + 1,
          codigo: item.product_sku || item.product_id.substring(0, 8),
          descricao: item.product_name,
          ncm: '00000000', // Should be fetched from product
          cfop: '5102', // Standard CFOP for internal sales
          unidade: 'UN',
          quantidade: item.quantity,
          valor_unitario: item.unit_price,
          valor_total: item.total_price,
          // Taxes - should be calculated based on product config
          icms_origem: '0',
          icms_situacao: '102',
          icms_aliquota: 0,
          icms_valor: 0,
          pis_situacao: '07',
          pis_aliquota: 0,
          pis_valor: 0,
          cofins_situacao: '07',
          cofins_aliquota: 0,
          cofins_valor: 0,
        })),

        // Totals
        valor_produtos: sale.subtotal,
        valor_desconto: sale.discount,
        valor_total: sale.total,

        // Payment
        forma_pagamento: sale.payment_method,

        // Emission
        data_emissao: new Date().toISOString(),
        tipo_emissao: isContingencyActive ? '9' : '1', // 9 = contingency, 1 = normal
      };

      // Check if contingency mode is active
      if (isContingencyActive) {
        // Add to queue instead of transmitting
        await addToQueue(nfceData);
        return {
          success: true,
          contingency: true,
          message: 'NFC-e adicionada à fila de contingência',
        };
      }

      // Emit normally
      try {
        const nfce = await emitNFCe(nfceData);
        return {
          success: true,
          contingency: false,
          nfce,
        };
      } catch (error) {
        // If emission fails, try to activate contingency and add to queue
        console.error('Error emitting NFC-e from PDV:', error);
        
        if (!autoEmit) {
          throw error; // Let user handle manual emission errors
        }

        // Auto-activate contingency for automatic emissions
        try {
          await addToQueue(nfceData);
          return {
            success: true,
            contingency: true,
            message: 'Erro na transmissão. NFC-e adicionada à fila de contingência.',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        } catch (queueError) {
          throw queueError;
        }
      }
    },
    onSuccess: (result) => {
      if (result.contingency) {
        toast({
          title: "Modo Contingência",
          description: result.message || "NFC-e será transmitida posteriormente",
          variant: "default",
        });
      } else {
        toast({
          title: "NFC-e emitida",
          description: `NFC-e ${result.nfce?.numero} autorizada com sucesso`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao emitir NFC-e",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  return {
    emitNFCeFromSale: emitNFCeFromSale.mutate,
    isEmitting: emitNFCeFromSale.isPending,
  };
}
