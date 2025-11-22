import { WorkflowAutomationPanel } from '@/components/finance/WorkflowAutomationPanel';

export default function AutomacaoFinanceira() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Automação Financeira</h1>
        <p className="text-muted-foreground mt-1">
          Workflows inteligentes e sincronização automática entre módulos
        </p>
      </div>

      <WorkflowAutomationPanel />
    </div>
  );
}
