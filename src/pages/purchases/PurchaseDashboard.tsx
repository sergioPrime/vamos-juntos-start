import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePurchases } from "@/hooks/usePurchases"
import { useOrganization } from "@/hooks/useOrganization"
import { ShoppingCart, TrendingUp, Clock, DollarSign, Package, AlertCircle, Plus } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "@/hooks/use-toast"

export default function PurchaseDashboard() {
  const { currentOrg } = useOrganization()
  const { purchases, isLoading } = usePurchases()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    received: 0,
    totalValue: 0,
    pendingValue: 0
  })

  useEffect(() => {
    if (purchases) {
      const total = purchases.length
      const pending = purchases.filter(p => p.status === 'pending').length
      const approved = purchases.filter(p => p.status === 'approved').length
      const received = purchases.filter(p => p.status === 'received').length
      
      const totalValue = purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0)
      const pendingValue = purchases
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + (p.total_amount || 0), 0)

      setStats({ total, pending, approved, received, totalValue, pendingValue })
    }
  }, [purchases])

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: "Pendente", className: "bg-yellow-500" },
      approved: { label: "Aprovado", className: "bg-blue-500" },
      received: { label: "Recebido", className: "bg-green-500" },
      cancelled: { label: "Cancelado", className: "bg-red-500" }
    }
    const variant = variants[status as keyof typeof variants] || { label: status, className: "bg-gray-500" }
    return <Badge className={variant.className}>{variant.label}</Badge>
  }

  const recentPurchases = purchases?.slice(0, 5) || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando dados de compras...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Compras</h1>
          <p className="text-muted-foreground">Visão geral dos pedidos de compra</p>
        </div>
        <Button onClick={() => navigate('/purchases/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Pedidos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aguardando Aprovação</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              R$ {stats.pendingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  R$ {(stats.totalValue / 1000).toFixed(1)}k
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/purchases')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Ver Todos os Pedidos
            </CardTitle>
            <CardDescription>Gerencie todos os pedidos de compra</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/purchases/requests')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Solicitações
            </CardTitle>
            <CardDescription>Gerencie solicitações de compra</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/purchases/reports')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Relatórios
            </CardTitle>
            <CardDescription>Análises e indicadores</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Purchases */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
          <CardDescription>Últimos 5 pedidos de compra</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPurchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum pedido de compra ainda</p>
              <Button variant="link" onClick={() => navigate('/purchases/new')}>
                Criar primeiro pedido
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/purchases/${purchase.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">Pedido #{purchase.purchase_number}</p>
                      {getStatusBadge(purchase.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(purchase.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      R$ {purchase.total_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => navigate('/purchases')}>
                Ver Todos os Pedidos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
