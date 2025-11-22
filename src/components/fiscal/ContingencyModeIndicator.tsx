import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CloudOff, RefreshCw, WifiOff } from 'lucide-react';
import { useContingencyMode } from '@/hooks/useContingencyMode';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContingencyModeIndicatorProps {
  orgId: string;
}

export function ContingencyModeIndicator({ orgId }: ContingencyModeIndicatorProps) {
  const {
    contingencyStatus,
    queueCount,
    isContingencyActive,
    synchronizeQueue,
    isSynchronizing,
  } = useContingencyMode(orgId);

  if (!isContingencyActive) {
    return null;
  }

  const startTime = contingencyStatus?.data_inicio_contingencia
    ? formatDistanceToNow(new Date(contingencyStatus.data_inicio_contingencia), {
        addSuffix: true,
        locale: ptBR,
      })
    : '';

  return (
    <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <div className="flex items-start justify-between gap-4 w-full">
        <div className="flex-1">
          <AlertTitle className="text-orange-900 dark:text-orange-100 flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            Modo Contingência Ativo
            <Badge variant="outline" className="ml-2">
              {queueCount} na fila
            </Badge>
          </AlertTitle>
          <AlertDescription className="text-orange-800 dark:text-orange-200 space-y-2">
            <p>
              <strong>Motivo:</strong> {contingencyStatus?.motivo_contingencia || 'Não especificado'}
            </p>
            <p>
              <strong>Ativo desde:</strong> {startTime}
            </p>
            <p className="text-sm">
              As NFC-e estão sendo armazenadas localmente e serão transmitidas automaticamente
              quando a conexão for restabelecida.
            </p>
          </AlertDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => synchronizeQueue()}
          disabled={isSynchronizing || queueCount === 0}
          className="border-orange-500 text-orange-700 hover:bg-orange-100"
        >
          {isSynchronizing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <CloudOff className="h-4 w-4 mr-2" />
              Sincronizar ({queueCount})
            </>
          )}
        </Button>
      </div>
    </Alert>
  );
}
