import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNFCeContingency } from '@/hooks/useNFCeContingency';
import { useOrganization } from '@/hooks/useOrganization';
import { 
  Power, 
  PowerOff, 
  AlertTriangle, 
  CheckCircle, 
  Upload,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { NFCeContingencyQueue } from './NFCeContingencyQueue';

export function NFCeContingencyPanel() {
  const { currentOrg } = useOrganization();
  const {
    isContingencyActive,
    contingencyQueue,
    isTransmitting,
    checkContingencyStatus,
    activateContingency,
    deactivateContingency,
    loadContingencyQueue,
    transmitAllFromQueue
  } = useNFCeContingency();

  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentOrg?.id) {
      checkContingencyStatus(currentOrg.id);
      loadContingencyQueue(currentOrg.id);
    }
  }, [currentOrg?.id]);

  const handleActivate = async () => {
    if (!currentOrg?.id) return;
    if (!reason.trim() || reason.length < 15) {
      return;
    }

    setIsLoading(true);
    try {
      await activateContingency(currentOrg.id, reason);
      setReason('');
      await loadContingencyQueue(currentOrg.id);
    } catch (error) {
      console.error('Erro ao ativar contingência:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!currentOrg?.id) return;

    setIsLoading(true);
    try {
      await deactivateContingency(currentOrg.id);
      await loadContingencyQueue(currentOrg.id);
    } catch (error) {
      console.error('Erro ao desativar contingência:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransmitAll = async () => {
    if (!currentOrg?.id) return;

    try {
      await transmitAllFromQueue(currentOrg.id);
    } catch (error) {
      console.error('Erro ao transmitir fila:', error);
    }
  };

  const handleRefresh = () => {
    if (currentOrg?.id) {
      loadContingencyQueue(currentOrg.id);
    }
  };

  const pendingCount = contingencyQueue.filter(
    item => item.status === 'pending' || item.status === 'failed'
  ).length;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isContingencyActive ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Contingência Ativa
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-success" />
                    Sistema Normal
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {isContingencyActive
                  ? 'NFC-e sendo emitidas em modo offline'
                  : 'NFC-e sendo transmitidas normalmente para SEFAZ'}
              </CardDescription>
            </div>
            <Badge variant={isContingencyActive ? 'destructive' : 'default'}>
              {isContingencyActive ? 'OFFLINE' : 'ONLINE'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isContingencyActive ? (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  As NFC-e estão sendo armazenadas localmente e serão transmitidas
                  automaticamente quando a conexão com a SEFAZ for restabelecida.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={handleDeactivate}
                  disabled={isLoading}
                  variant="default"
                  className="flex-1"
                >
                  <Power className="h-4 w-4 mr-2" />
                  Desativar Contingência
                </Button>

                {pendingCount > 0 && (
                  <Button
                    onClick={handleTransmitAll}
                    disabled={isTransmitting}
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Transmitir Todas ({pendingCount})
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Motivo da Contingência (mínimo 15 caracteres)
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Ex: Queda de conexão com a SEFAZ, servidor indisponível..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  minLength={15}
                  maxLength={200}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  {reason.length}/200 caracteres
                </p>
              </div>

              <Button
                onClick={handleActivate}
                disabled={isLoading || reason.length < 15}
                variant="destructive"
                className="w-full"
              >
                <PowerOff className="h-4 w-4 mr-2" />
                Ativar Modo Contingência
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Queue Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fila de Transmissão</CardTitle>
              <CardDescription>
                NFC-e aguardando transmissão para SEFAZ
              </CardDescription>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <NFCeContingencyQueue 
            queue={contingencyQueue}
            onRefresh={handleRefresh}
          />
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Quando usar contingência:</strong> Ative o modo contingência quando
          houver problemas de conexão com a SEFAZ ou instabilidade na rede. As NFC-e
          serão armazenadas localmente e transmitidas automaticamente quando o sistema
          for normalizado.
        </AlertDescription>
      </Alert>
    </div>
  );
}
