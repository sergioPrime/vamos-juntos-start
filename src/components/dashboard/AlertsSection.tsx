import { useState } from 'react'
import { AlertCard } from './AlertCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useInventoryAlerts, InventoryAlert } from '@/hooks/useInventoryAlerts'
import { useBusinessAlerts, BusinessAlert } from '@/hooks/useBusinessAlerts'
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Package, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  DollarSign,
  Wallet,
  Target,
  Zap,
  FileX,
  Settings,
  RefreshCw
} from 'lucide-react'

export function AlertsSection() {
  const [alertOrder, setAlertOrder] = useState<string[]>([])
  
  const {
    alerts: inventoryAlerts,
    loading: inventoryLoading,
    resolveAlert: resolveInventoryAlert,
    checkAllAlerts: checkInventoryAlerts,
    getUnresolvedAlertsCount: getInventoryAlertsCount
  } = useInventoryAlerts()

  const {
    alerts: businessAlerts,
    loading: businessLoading,
    resolveAlert: resolveBusinessAlert,
    checkAllAlerts: checkBusinessAlerts,
    getUnresolvedAlertsCount: getBusinessAlertsCount
  } = useBusinessAlerts()

  const allAlerts = [...inventoryAlerts, ...businessAlerts]
  const loading = inventoryLoading || businessLoading
  const totalAlertsCount = getInventoryAlertsCount() + getBusinessAlertsCount()

  const getAlertIcon = (alert: InventoryAlert | BusinessAlert) => {
    if ('product_id' in alert) {
      // Inventory alert
      switch (alert.type) {
        case 'low_stock':
          return <Package className="h-4 w-4" />
        case 'near_expiry':
          return <Calendar className="h-4 w-4" />
        case 'high_turnover':
          return <TrendingUp className="h-4 w-4" />
        case 'inventory_variance':
          return <BarChart3 className="h-4 w-4" />
        default:
          return <AlertTriangle className="h-4 w-4" />
      }
    } else {
      // Business alert
      switch (alert.type) {
        case 'overdue_receivables':
          return <DollarSign className="h-4 w-4" />
        case 'low_balance':
          return <Wallet className="h-4 w-4" />
        case 'budget_exceeded':
          return <Target className="h-4 w-4" />
        case 'integration_failure':
          return <Zap className="h-4 w-4" />
        case 'rejected_nfse':
          return <FileX className="h-4 w-4" />
        default:
          return <AlertCircle className="h-4 w-4" />
      }
    }
  }

  const handleResolveAlert = (alertId: string) => {
    const inventoryAlert = inventoryAlerts.find(a => a.id === alertId)
    if (inventoryAlert) {
      resolveInventoryAlert(alertId)
    } else {
      resolveBusinessAlert(alertId)
    }
  }

  const handleRefreshAlerts = () => {
    checkInventoryAlerts()
    checkBusinessAlerts()
  }

  // Sort alerts by severity (critical > high > medium > low)
  const sortedAlerts = allAlerts.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })

  const criticalAlerts = allAlerts.filter(alert => alert.severity === 'critical')
  const highAlerts = allAlerts.filter(alert => alert.severity === 'high')
  const mediumAlerts = allAlerts.filter(alert => alert.severity === 'medium')
  const lowAlerts = allAlerts.filter(alert => alert.severity === 'low')

  if (allAlerts.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
            <Info className="h-6 w-6 text-success" />
          </div>
          <CardTitle className="text-success">Tudo em ordem!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Nenhum alerta ativo no momento. Seu sistema está funcionando perfeitamente.
          </p>
          <Button 
            variant="outline" 
            onClick={handleRefreshAlerts}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Verificar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Alertas do Sistema</h2>
          <p className="text-muted-foreground">
            {totalAlertsCount} alerta(s) requerem sua atenção
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefreshAlerts}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalAlerts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-500">Altos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{highAlerts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Médios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{mediumAlerts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-500">Baixos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{lowAlerts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedAlerts.map((alert) => (
          <AlertCard
            key={alert.id}
            id={alert.id}
            title={alert.title}
            description={alert.description}
            severity={alert.severity}
            icon={getAlertIcon(alert)}
            actionLabel={'action_label' in alert ? alert.action_label : undefined}
            actionRoute={'action_route' in alert ? alert.action_route : undefined}
            onResolve={handleResolveAlert}
          />
        ))}
      </div>
    </div>
  )
}