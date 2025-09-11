import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, DollarSign, AlertTriangle, Download, Users, FileText, ShoppingBag } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useCountUp, formatCurrency } from "@/hooks/useCountUp"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { useFinancialData } from "@/hooks/useFinancialData"
import { supabase } from "@/integrations/supabase/client"
import { useOrganization } from "@/hooks/useOrganization"
import { useToast } from "@/hooks/use-toast"

interface OverdueInvoice {
  id: string
  customer_name: string
  title: string
  total_amount: number
  due_date: string
  days_overdue: number
}

export default function Reports() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const organization = useOrganization()
  const { metrics, loading } = useFinancialData()
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([])
  const [loadingOverdue, setLoadingOverdue] = useState(true)
  
  const monthlyRevenueCount = useCountUp(metrics.monthlyRevenue)
  const receivedAmountCount = useCountUp(metrics.monthlyRevenue - metrics.pendingReceivables)
  const overdueAmountCount = useCountUp(metrics.overdueAmount)

  useEffect(() => {
    if (organization?.currentOrg?.id) {
      loadOverdueInvoices()
    }
  }, [organization])

  const loadOverdueInvoices = async () => {
    try {
      setLoadingOverdue(true)
      const today = new Date()
      
      const { data: overdueData, error } = await supabase
        .from("invoices")
        .select(`
          id,
          title,
          total_amount,
          due_date,
          customers!inner(name)
        `)
        .eq("org_id", organization?.currentOrg?.id)
        .eq("status", "pending")
        .not("due_date", "is", null)
        .lt("due_date", today.toISOString().split('T')[0])
        .order("due_date", { ascending: true })

      if (error) throw error

      const overdueWithDays = overdueData?.map(invoice => {
        const dueDate = new Date(invoice.due_date)
        const diffTime = today.getTime() - dueDate.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        return {
          id: invoice.id,
          customer_name: (invoice.customers as any)?.name || "Cliente não identificado",
          title: invoice.title,
          total_amount: Number(invoice.total_amount),
          due_date: invoice.due_date,
          days_overdue: diffDays
        }
      }) || []

      setOverdueInvoices(overdueWithDays)
    } catch (error) {
      console.error("Error loading overdue invoices:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar faturas em atraso",
        variant: "destructive",
      })
    } finally {
      setLoadingOverdue(false)
    }
  }

  const handleExportCSV = () => {
    toast({
      title: "Exportação",
      description: "Funcionalidade de exportação CSV será implementada",
    })
  }

  const handleExportPDF = () => {
    toast({
      title: "Exportação", 
      description: "Funcionalidade de exportação PDF será implementada",
    })
  }

  const getDaysOverdueBadge = (days: number) => {
    if (days > 30) {
      return <Badge variant="destructive">{days} dias</Badge>
    } else if (days > 10) {
      return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">{days} dias</Badge>
    } else {
      return <Badge variant="secondary">{days} dias</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Back Navigation */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="p-1 sm:p-2 hover:bg-accent"
          size="sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Relatórios</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Análise baseada em dados reais do sistema</p>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2 justify-center sm:justify-end flex-wrap">
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
        <Button variant="outline" onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Métricas principais */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(monthlyRevenueCount)}
            </div>
            <p className="text-xs text-muted-foreground">Receita mensal atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebimentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(receivedAmountCount)}
            </div>
            <p className="text-xs text-muted-foreground">Valores já recebidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(overdueAmountCount)}
            </div>
            <p className="text-xs text-muted-foreground">{overdueInvoices.length} faturas em atraso</p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Estatísticas do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{metrics.totalCustomers}</div>
                <div className="text-sm text-muted-foreground">Clientes</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{metrics.totalInvoices}</div>
                <div className="text-sm text-muted-foreground">Faturas</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{metrics.totalProducts}</div>
                <div className="text-sm text-muted-foreground">Produtos</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{formatCurrency(metrics.totalBalance)}</div>
                <div className="text-sm text-muted-foreground">Saldo Total</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clientes em Atraso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Clientes em Atraso</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fatura</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Dias em Atraso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingOverdue ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="animate-pulse">Carregando...</div>
                    </TableCell>
                  </TableRow>
                ) : overdueInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum cliente em atraso encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  overdueInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.customer_name}</TableCell>
                      <TableCell>{invoice.title}</TableCell>
                      <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell>{getDaysOverdueBadge(invoice.days_overdue)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>
    </div>
  )
}