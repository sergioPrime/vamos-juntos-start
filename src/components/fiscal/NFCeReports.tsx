import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  DollarSign,
  FileCheck,
  FileX
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export function NFCeReports() {
  const { currentOrganization } = useOrganization();
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [reportType, setReportType] = useState('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    authorized: 0,
    cancelled: 0,
    rejected: 0,
    totalValue: 0,
    averageValue: 0
  });

  useEffect(() => {
    if (currentOrganization?.id) {
      loadSummary();
    }
  }, [currentOrganization?.id, startDate, endDate]);

  const loadSummary = async () => {
    if (!currentOrganization?.id) return;

    try {
      const start = startOfDay(new Date(startDate));
      const end = endOfDay(new Date(endDate));

      const { data, error } = await supabase
        .from('nfce')
        .select('status, valor_total')
        .eq('org_id', currentOrganization.id)
        .gte('data_emissao', start.toISOString())
        .lte('data_emissao', end.toISOString());

      if (error) throw error;

      const total = data?.length || 0;
      const authorized = data?.filter(n => n.status === 'autorizada').length || 0;
      const cancelled = data?.filter(n => n.status === 'cancelada').length || 0;
      const rejected = data?.filter(n => n.status === 'rejeitada').length || 0;
      const totalValue = data?.reduce((sum, n) => sum + (n.valor_total || 0), 0) || 0;
      const averageValue = total > 0 ? totalValue / total : 0;

      setSummary({
        total,
        authorized,
        cancelled,
        rejected,
        totalValue,
        averageValue
      });
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    }
  };

  const handleGenerateReport = async () => {
    if (!currentOrganization?.id) return;

    setIsGenerating(true);
    try {
      const start = startOfDay(new Date(startDate));
      const end = endOfDay(new Date(endDate));

      const { data, error } = await supabase
        .from('nfce')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .gte('data_emissao', start.toISOString())
        .lte('data_emissao', end.toISOString())
        .order('data_emissao', { ascending: false });

      if (error) throw error;

      // Generate CSV
      const headers = ['Número', 'Série', 'Data Emissão', 'Valor Total', 'Status', 'Chave Acesso', 'Protocolo'];
      const rows = data?.map(nfce => [
        nfce.numero,
        nfce.serie,
        format(new Date(nfce.data_emissao), 'dd/MM/yyyy HH:mm'),
        nfce.valor_total?.toFixed(2),
        nfce.status,
        nfce.chave_acesso || '',
        nfce.protocolo_autorizacao || ''
      ]) || [];

      const csv = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\n');

      // Download CSV
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `nfce_report_${startDate}_${endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total NFC-e</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">
              No período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Autorizadas</CardTitle>
            <FileCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{summary.authorized}</div>
            <p className="text-xs text-muted-foreground">
              {summary.total > 0 ? ((summary.authorized / summary.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {summary.totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Média: R$ {summary.averageValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problemas</CardTitle>
            <FileX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {summary.cancelled + summary.rejected}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.cancelled} canceladas, {summary.rejected} rejeitadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Relatório
          </CardTitle>
          <CardDescription>
            Exporte relatórios detalhados de NFC-e para análise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportType">Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="reportType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Resumo</SelectItem>
                  <SelectItem value="detailed">Detalhado</SelectItem>
                  <SelectItem value="financial">Financeiro</SelectItem>
                  <SelectItem value="products">Por Produto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>Gerando...</>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar e Baixar (CSV)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Rápidos</CardTitle>
          <CardDescription>
            Acesse relatórios pré-configurados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              setStartDate(format(startOfDay(new Date()), 'yyyy-MM-dd'));
              setEndDate(format(endOfDay(new Date()), 'yyyy-MM-dd'));
            }}
          >
            <Calendar className="h-4 w-4 mr-2" />
            NFC-e de Hoje
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
              setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
            }}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            NFC-e deste Mês
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
