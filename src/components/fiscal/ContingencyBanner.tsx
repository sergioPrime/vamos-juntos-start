import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useContingencyMode } from '@/hooks/useContingencyMode'
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

export function ContingencyBanner() {
  const { 
    isActive, 
    activatedAt, 
    queueCount, 
    deactivateContingency, 
    syncQueue 
  } = useContingencyMode()

  if (!isActive) return null

  return (
    <Alert className="border-yellow-500/50 bg-yellow-500/10">
      <WifiOff className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-yellow-600 font-medium">
            <AlertTriangle className="w-4 h-4" />
            Modo de Contingência Ativo
          </div>
          <div className="text-sm text-muted-foreground">
            {activatedAt && `Desde ${format(activatedAt, "dd/MM/yyyy 'às' HH:mm")}`}
            {' • '}
            {queueCount} nota(s) pendente(s) de sincronização
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => syncQueue()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Sincronizar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => deactivateContingency()}
          >
            Desativar
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
