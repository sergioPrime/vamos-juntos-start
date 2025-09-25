import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, DollarSign, Package, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useBusinessNotifications } from '@/hooks/useBusinessNotifications'
import { useStockValidation } from '@/hooks/useStockValidation'
import { useOrganization } from '@/hooks/useOrganization'
import { supabase } from '@/integrations/supabase/client'

interface BusinessMetrics {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  lowStockCount: number
  overduePayments: number
  monthlyGrowth: number
}

export function BusinessInsightsPanel() {
  const navigate = useNavigate()
  const { currentOrg } = useOrganization()
  const { checkLowStock } = useStockValidation()
  const { runPeriodicChecks } = useBusinessNotifications()
  
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    lowStockCount: 0,
    overduePayments: 0,
    monthlyGrowth: 0
  })
  
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<Array<{type: 'warning' | 'info' | 'success', message: string}>>([])

  useEffect(() => {
    if (currentOrg?.id) {
      loadBusinessMetrics()
      runPeriodicChecks()
    }
  }, [currentOrg?.id, runPeriodicChecks])

  const loadBusinessMetrics = async () => {
    if (!currentOrg?.id) return
    
    try {
      setLoading(true)
      
      // Get financial data
      const { data: financial, error: financialError } = await supabase
        .from('financial_entries')
        .select('amount, entry_type, is_settled, due_date, created_at')
        .eq('org_id', currentOrg.id)

      if (financialError) throw financialError

      // Get orders data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, status, created_at')
        .eq('org_id', currentOrg.id)

      if (ordersError) throw ordersError

      // Get customers count
      const { data: customers, error: customersError } = await supabase
        .from('pessoas')
        .select('id')
        .eq('org_id', currentOrg.id)
        .eq('ativo', true)

      if (customersError) throw customersError

      // Check low stock
      const lowStockProducts = await checkLowStock()

      // Calculate metrics
      const totalRevenue = orders?.reduce((sum, order) => 
        order.status === 'completed' ? sum + (order.total_amount || 0) : sum, 0) || 0

      const overduePayments = financial?.filter(entry => 
        entry.entry_type === 'payable' && 
        !entry.is_settled && 
        new Date(entry.due_date) < new Date()
      ).length || 0

      // Calculate monthly growth (simplified)
      const thisMonth = new Date().getMonth()
      const thisMonthOrders = orders?.filter(order => 
        new Date(order.created_at).getMonth() === thisMonth
      ) || []
      
      const lastMonthOrders = orders?.filter(order => 
        new Date(order.created_at).getMonth() === thisMonth - 1
      ) || []

      const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => 
        sum + (order.total_amount || 0), 0)
      const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => 
        sum + (order.total_amount || 0), 0)

      const monthlyGrowth = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0

      setMetrics({
        totalRevenue,
        totalOrders: orders?.length || 0,
        totalCustomers: customers?.length || 0,
        lowStockCount: lowStockProducts.length,
        overduePayments,
        monthlyGrowth
      })

      // Generate alerts
      const newAlerts = []
      if (lowStockProducts.length > 0) {
        newAlerts.push({
          type: 'warning' as const,
          message: `${lowStockProducts.length} produto(s) com estoque baixo`
        })
      }
      if (overduePayments > 0) {
        newAlerts.push({
          type: 'warning' as const,
          message: `${overduePayments} pagamento(s) em atraso`
        })
      }
      if (monthlyGrowth > 10) {
        newAlerts.push({
          type: 'success' as const,
          message: `Crescimento de ${monthlyGrowth.toFixed(1)}% este mês!`
        })
      }

      setAlerts(newAlerts)
    } catch (error) {
      console.error('Error loading business metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'warning' ? 'destructive' : 'default'}>
              {alert.type === 'warning' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : alert.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/finance/receivables')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {metrics.totalRevenue.toFixed(2)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {metrics.monthlyGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={metrics.monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(metrics.monthlyGrowth).toFixed(1)}%
              </span>
              <span>este mês</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/orders')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Total de pedidos registrados
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/pessoas')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Clientes ativos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/inventory')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{metrics.lowStockCount}</div>
              {metrics.lowStockCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  Baixo
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.lowStockCount > 0 ? 'Produtos com estoque baixo' : 'Estoque OK'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/pdv')}>
              Nova Venda
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/quotes')}>
              Novo Orçamento
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/inventory/stock-entry')}>
              Entrada Estoque
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/finance/receivables')}>
              Cobrança PIX
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}