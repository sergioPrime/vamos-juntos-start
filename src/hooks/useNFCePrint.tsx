import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useReactToPrint } from 'react-to-print';

/**
 * Hook for printing NFC-e DANFE
 * Supports thermal printer and PDF generation
 */
export function useNFCePrint() {
  const { toast } = useToast();
  const componentRef = useRef<HTMLDivElement>(null);

  // Print to thermal printer
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'DANFE-NFCe',
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .danfe-nfce {
          width: 80mm;
          max-width: 80mm;
        }
      }
    `,
    onAfterPrint: () => {
      toast({
        title: "Impressão concluída",
        description: "DANFE NFC-e enviado para impressora",
      });
    },
  });

  // Generate PDF
  const generatePDF = useCallback(async () => {
    try {
      if (!componentRef.current) {
        throw new Error('Componente não encontrado');
      }

      // Use html2canvas to convert to image first
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(componentRef.current, {
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Convert to PDF using jsPDF
      const jsPDF = (await import('jspdf')).default;
      const imgData = canvas.toDataURL('image/png');
      
      // A4 size in mm, but we'll use 80mm width
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, canvas.height * (80 / canvas.width)],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 80, canvas.height * (80 / canvas.width));
      pdf.save('DANFE-NFCe.pdf');

      toast({
        title: "PDF gerado com sucesso",
        description: "DANFE NFC-e salvo como PDF",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Send to thermal printer via USB/Serial
  const sendToThermalPrinter = useCallback(async (printerName?: string) => {
    try {
      if (!componentRef.current) {
        throw new Error('Componente não encontrado');
      }

      // Get HTML content
      const htmlContent = componentRef.current.innerHTML;

      // In a real implementation, this would use:
      // 1. Electron with node-thermal-printer for desktop apps
      // 2. WebUSB API for browser-based printing
      // 3. Or a backend service that handles thermal printing

      // For now, we'll simulate the thermal print
      console.log('Sending to thermal printer:', printerName);
      console.log('HTML content length:', htmlContent.length);

      // Call regular print as fallback
      handlePrint();

      toast({
        title: "Enviando para impressora térmica",
        description: printerName || "Impressora padrão",
      });
    } catch (error) {
      console.error('Error sending to thermal printer:', error);
      toast({
        title: "Erro ao enviar para impressora",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  }, [handlePrint, toast]);

  return {
    componentRef,
    handlePrint,
    generatePDF,
    sendToThermalPrinter,
  };
}
