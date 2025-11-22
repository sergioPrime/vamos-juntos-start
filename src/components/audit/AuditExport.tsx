import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Download, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function AuditExport() {
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!currentOrg?.id || !startDate || !endDate) {
      toast({
        title: 'Erro',
        description: 'Selecione as datas de início e fim',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      const { data, error } = await supabase.rpc('export_audit_logs', {
        p_org_id: currentOrg.id,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      }) as { data: any[] | null; error: any };

      if (error) throw error;

      // Converter para CSV
      if (!data || !Array.isArray(data) || data.length === 0) {
        toast({
          title: 'Nenhum dado',
          description: 'Não há logs de auditoria no período selecionado',
        });
        return;
      }

      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map((row: any) =>
          headers.map((header) => {
            const value = row[header] || '';
            // Escapar aspas e adicionar aspas se contiver vírgula
            return value.includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
          }).join(',')
        ),
      ].join('\n');

      // Download do arquivo
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `audit-logs-${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}.csv`
      );
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Sucesso',
        description: 'Logs de auditoria exportados com sucesso',
      });

      setOpen(false);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao exportar logs de auditoria',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar Logs de Auditoria</DialogTitle>
          <DialogDescription>
            Selecione o período para exportar os logs em formato CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Data Inicial</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, 'PPP', { locale: ptBR })
                  ) : (
                    'Selecione a data inicial'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Data Final</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? (
                    format(endDate, 'PPP', { locale: ptBR })
                  ) : (
                    'Selecione a data final'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exportando...' : 'Exportar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
