import { AuditLogsTable } from '@/components/audit/AuditLogsTable';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';

export default function AuditLogs() {
  usePermissionCheck('configuracoes', 'read');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h1>
        <p className="text-muted-foreground">
          Acompanhe todas as alterações e ações realizadas no sistema
        </p>
      </div>

      <AuditLogsTable />
    </div>
  );
}
