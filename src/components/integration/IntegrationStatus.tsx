import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, XCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useInventoryIntegration } from '@/hooks/useInventoryIntegration'
import { useToast } from '@/hooks/use-toast'

interface IntegrationModule {
  name: string
  status: 'active' | 'inactive' | 'error'
  description: string
  lastSync?: string
}

export function IntegrationStatus() {
  const { checkStockLevels } = useInventoryIntegration()
  const { toast } = useToast()
  const [lowStockCount, setLowStockCount] = useState(0)
  const [lastCheck, setLastCheck] = useState<string>('')

  const integrations: IntegrationModule[] = [
    {
      name: 'Módulo de Vendas',
      status: 'active',
      description: 'Saída automática de estoque após faturamento',
      lastSync: new Date().toLocaleString('pt-BR')
    },
    {
      name: 'Módulo de Compras',
      status: 'active',
      description: 'Entrada automática após nota de entrada',
      lastSync: new Date().toLocaleString('pt-BR')
    },
    {
      name: 'Módulo Financeiro',
      status: 'active',
      description: 'Cálculo automático do CMV',
      lastSync: new Date().toLocaleString('pt-BR')
    }
  ]

  const checkStockStatus = async () => {
    try {
      const lowStockProducts = await checkStockLevels()
      setLowStockCount(lowStockProducts.length)
      setLastCheck(new Date().toLocaleString('pt-BR'))
      
      if (lowStockProducts.length > 0) {
        toast({
          title: "Atenção: Estoque baixo",
          description: `${lowStockProducts.length} produto(s) com estoque abaixo do mínimo.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao verificar estoque",
        description: "Não foi possível verificar os níveis de estoque.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    checkStockStatus()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-warning" />
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Status das Integrações
            <Button
              variant="outline"
              size="sm"
              onClick={checkStockStatus}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map((integration, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(integration.status)}
                <div>
                  <div className="font-medium">{integration.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {integration.description}
                  </div>
                  {integration.lastSync && (
                    <div className="text-xs text-muted-foreground">
                      Última sincronização: {integration.lastSync}
                    </div>
                  )}
                </div>
              </div>
              <Badge variant={getStatusColor(integration.status) as any}>
                {integration.status === 'active' ? 'Ativo' : 
                 integration.status === 'inactive' ? 'Inativo' : 'Erro'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alertas de Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {lowStockCount > 0 ? (
                  <AlertCircle className="h-4 w-4 text-warning" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-success" />
                )}
                <div>
                  <div className="font-medium">
                    {lowStockCount > 0 ? 'Produtos com estoque baixo' : 'Estoque em níveis adequados'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {lowStockCount > 0 
                      ? `${lowStockCount} produto(s) abaixo do estoque mínimo`
                      : 'Todos os produtos estão com estoque adequado'
                    }
                  </div>
                  {lastCheck && (
                    <div className="text-xs text-muted-foreground">
                      Última verificação: {lastCheck}
                    </div>
                  )}
                </div>
              </div>
              <Badge variant={lowStockCount > 0 ? 'destructive' : 'default'}>
                {lowStockCount > 0 ? 'Atenção' : 'OK'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}