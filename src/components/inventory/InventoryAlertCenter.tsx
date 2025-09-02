import { useState } from 'react'
import { Bell, AlertCircle, AlertTriangle, Info, CheckCircle, X, Settings, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useInventoryAlerts, InventoryAlert } from '@/hooks/useInventoryAlerts'

export function InventoryAlertCenter() {
  const {
    alerts,
    alertSettings,
    loading,
    checkAllAlerts,
    resolveAlert,
    updateAlertSettings,
    getAlertsByType,
    getAlertsBySeverity,
    getUnresolvedAlertsCount
  } = useInventoryAlerts()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [localSettings, setLocalSettings] = useState(alertSettings)

  const getSeverityIcon = (severity: InventoryAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-warning" />
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getSeverityColor = (severity: InventoryAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getTypeLabel = (type: InventoryAlert['type']) => {
    switch (type) {
      case 'low_stock':
        return 'Estoque Baixo'
      case 'near_expiry':
        return 'Próximo ao Vencimento'
      case 'high_turnover':
        return 'Alto Giro'
      case 'inventory_variance':
        return 'Divergência de Inventário'
      default:
        return type
    }
  }

  const handleSaveSettings = () => {
    updateAlertSettings(localSettings)
    setIsSettingsOpen(false)
  }

  const criticalAlerts = getAlertsBySeverity('critical')
  const highAlerts = getAlertsBySeverity('high')
  const mediumAlerts = getAlertsBySeverity('medium')
  const lowAlerts = getAlertsBySeverity('low')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <div>
            <h2 className="text-2xl font-bold">Central de Alertas</h2>
            <p className="text-muted-foreground">
              {getUnresolvedAlertsCount()} alerta(s) pendente(s)
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkAllAlerts}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Verificar
          </Button>
          
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configurações de Alertas</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="low_stock">Alertas de Estoque Baixo</Label>
                    <Switch
                      id="low_stock"
                      checked={localSettings.low_stock_enabled}
                      onCheckedChange={(checked) =>
                        setLocalSettings(prev => ({ ...prev, low_stock_enabled: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="near_expiry">Alertas de Vencimento</Label>
                    <Switch
                      id="near_expiry"
                      checked={localSettings.near_expiry_enabled}
                      onCheckedChange={(checked) =>
                        setLocalSettings(prev => ({ ...prev, near_expiry_enabled: checked }))
                      }
                    />
                  </div>
                  
                  {localSettings.near_expiry_enabled && (
                    <div className="ml-4">
                      <Label htmlFor="expiry_days">Alertar com quantos dias de antecedência</Label>
                      <Input
                        id="expiry_days"
                        type="number"
                        min="1"
                        max="30"
                        value={localSettings.near_expiry_days}
                        onChange={(e) =>
                          setLocalSettings(prev => ({ ...prev, near_expiry_days: Number(e.target.value) }))
                        }
                        className="w-20 mt-1"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="high_turnover">Alertas de Alto Giro</Label>
                    <Switch
                      id="high_turnover"
                      checked={localSettings.high_turnover_enabled}
                      onCheckedChange={(checked) =>
                        setLocalSettings(prev => ({ ...prev, high_turnover_enabled: checked }))
                      }
                    />
                  </div>
                  
                  {localSettings.high_turnover_enabled && (
                    <div className="ml-4">
                      <Label htmlFor="turnover_threshold">Limite de saídas (30 dias)</Label>
                      <Input
                        id="turnover_threshold"
                        type="number"
                        min="1"
                        value={localSettings.high_turnover_threshold}
                        onChange={(e) =>
                          setLocalSettings(prev => ({ ...prev, high_turnover_threshold: Number(e.target.value) }))
                        }
                        className="w-20 mt-1"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="variance">Alertas de Divergência</Label>
                    <Switch
                      id="variance"
                      checked={localSettings.inventory_variance_enabled}
                      onCheckedChange={(checked) =>
                        setLocalSettings(prev => ({ ...prev, inventory_variance_enabled: checked }))
                      }
                    />
                  </div>
                  
                  {localSettings.inventory_variance_enabled && (
                    <div className="ml-4">
                      <Label htmlFor="variance_threshold">Limite de divergência (%)</Label>
                      <Input
                        id="variance_threshold"
                        type="number"
                        min="1"
                        max="100"
                        value={localSettings.inventory_variance_threshold}
                        onChange={(e) =>
                          setLocalSettings(prev => ({ ...prev, inventory_variance_threshold: Number(e.target.value) }))
                        }
                        className="w-20 mt-1"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveSettings}>
                    Salvar Configurações
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
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
            <CardTitle className="text-sm font-medium text-destructive">Altos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{highAlerts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-warning">Médios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{mediumAlerts.length}</div>
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

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Todos ({alerts.length})</TabsTrigger>
              <TabsTrigger value="low_stock">Estoque Baixo ({getAlertsByType('low_stock').length})</TabsTrigger>
              <TabsTrigger value="near_expiry">Vencimento ({getAlertsByType('near_expiry').length})</TabsTrigger>
              <TabsTrigger value="high_turnover">Alto Giro ({getAlertsByType('high_turnover').length})</TabsTrigger>
              <TabsTrigger value="inventory_variance">Divergência ({getAlertsByType('inventory_variance').length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                  <p>Nenhum alerta ativo no momento!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{alert.title}</span>
                            <Badge variant={getSeverityColor(alert.severity) as any}>
                              {getTypeLabel(alert.type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {(['low_stock', 'near_expiry', 'high_turnover', 'inventory_variance'] as const).map((type) => (
              <TabsContent key={type} value={type} className="mt-4">
                {getAlertsByType(type).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                    <p>Nenhum alerta deste tipo</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getAlertsByType(type).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getSeverityIcon(alert.severity)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{alert.title}</span>
                              <Badge variant={getSeverityColor(alert.severity) as any}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(alert.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}