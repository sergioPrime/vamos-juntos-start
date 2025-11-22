import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuditTimeline } from '@/components/audit/AuditTimeline';
import { AuditFilters, type AuditFiltersValues } from '@/components/audit/AuditFilters';
import { AuditExport } from '@/components/audit/AuditExport';
import { AuditLogsTable } from '@/components/audit/AuditLogsTable';
import { Shield, Clock, BarChart3 } from 'lucide-react';

export default function AuditLogsEnhanced() {
  const [filters, setFilters] = useState<AuditFiltersValues>({});

  const handleFiltersChange = (newFilters: AuditFiltersValues) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoria Avançada</h1>
          <p className="text-muted-foreground">
            Rastreamento completo de todas as ações no sistema
          </p>
        </div>
        <AuditExport />
      </div>

      <AuditFilters onFiltersChange={handleFiltersChange} onClear={handleClearFilters} />

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline" className="gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-2">
            <Shield className="h-4 w-4" />
            Tabela
          </TabsTrigger>
          <TabsTrigger value="statistics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <AuditTimeline
            entityType={filters.entityType}
            startDate={filters.startDate}
            endDate={filters.endDate}
          />
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>
                Visualização detalhada de todas as ações registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditLogsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Auditoria</CardTitle>
              <CardDescription>
                Em breve: estatísticas e análises detalhadas
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center text-muted-foreground">
              Funcionalidade em desenvolvimento
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
