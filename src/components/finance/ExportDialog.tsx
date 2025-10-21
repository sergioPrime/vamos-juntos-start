import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  Download, 
  FileText, 
  Printer,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { 
  exportFinancialMetricsToCSV,
  exportCashFlowToCSV,
  exportCategoriestoCSV,
  printHTMLReport,
  downloadHTMLReport,
  ExportData,
  ExportOptions
} from '@/utils/reportExporter';
import { toast } from 'sonner';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExportData;
  organizationName?: string;
  period?: {
    start: string;
    end: string;
  };
}

export function ExportDialog({ 
  open, 
  onOpenChange, 
  data,
  organizationName,
  period 
}: ExportDialogProps) {
  const [exportType, setExportType] = useState<'csv' | 'print' | 'html'>('csv');
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeCashFlow, setIncludeCashFlow] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [fileName, setFileName] = useState('relatorio_financeiro');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    
    try {
      const options: ExportOptions = {
        format: 'csv',
        fileName,
        organizationName,
        period
      };

      if (exportType === 'csv') {
        // Exportar múltiplos CSVs
        if (includeMetrics) {
          exportFinancialMetricsToCSV(data, { ...options, fileName: `${fileName}_metricas` });
        }
        if (includeCashFlow && data.cashFlowData) {
          exportCashFlowToCSV(data, { ...options, fileName: `${fileName}_fluxo_caixa` });
        }
        if (includeCategories) {
          exportCategoriestoCSV(data, options);
        }
        toast.success('Arquivos CSV exportados com sucesso');
      } else if (exportType === 'print') {
        // Imprimir relatório
        printHTMLReport(data, options);
        toast.success('Relatório enviado para impressão');
      } else if (exportType === 'html') {
        // Baixar HTML
        downloadHTMLReport(data, options);
        toast.success('Relatório HTML baixado com sucesso');
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error exporting:', error);
      toast.error(error.message || 'Erro ao exportar dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Relatório</DialogTitle>
          <DialogDescription>
            Escolha o formato e os dados que deseja exportar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo de Exportação */}
          <div className="space-y-3">
            <Label>Formato de Exportação</Label>
            <RadioGroup value={exportType} onValueChange={(value: any) => setExportType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>CSV (Excel)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="print" id="print" />
                <Label htmlFor="print" className="flex items-center gap-2 cursor-pointer">
                  <Printer className="h-4 w-4" />
                  <span>Imprimir / PDF</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="html" id="html" />
                <Label htmlFor="html" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  <span>HTML (Navegador)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Dados a Incluir (apenas para CSV) */}
          {exportType === 'csv' && (
            <div className="space-y-3">
              <Label>Dados a Incluir</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="metrics"
                    checked={includeMetrics}
                    onCheckedChange={(checked) => setIncludeMetrics(checked as boolean)}
                  />
                  <Label htmlFor="metrics" className="cursor-pointer">
                    Métricas Financeiras
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cashflow"
                    checked={includeCashFlow}
                    onCheckedChange={(checked) => setIncludeCashFlow(checked as boolean)}
                  />
                  <Label htmlFor="cashflow" className="cursor-pointer">
                    Fluxo de Caixa
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="categories"
                    checked={includeCategories}
                    onCheckedChange={(checked) => setIncludeCategories(checked as boolean)}
                  />
                  <Label htmlFor="categories" className="cursor-pointer">
                    Categorias (Receitas e Despesas)
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Nome do Arquivo */}
          <div className="space-y-2">
            <Label htmlFor="filename">Nome do Arquivo</Label>
            <Input
              id="filename"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="relatorio_financeiro"
            />
            <p className="text-xs text-muted-foreground">
              {exportType === 'csv' 
                ? 'Serão criados múltiplos arquivos com este prefixo' 
                : 'Nome base do arquivo de relatório'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Download className="mr-2 h-4 w-4" />
            {exportType === 'print' ? 'Imprimir' : 'Exportar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
