import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowLeft, TrendingUp, DollarSign, AlertTriangle, Download, Eye } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useCountUp, formatCurrency } from "@/hooks/useCountUp"

// Mock data for the chart
const monthlyRevenueData = [
  { month: "Jul", revenue: 8500 },
  { month: "Ago", revenue: 12000 },
  { month: "Set", revenue: 9800 },
  { month: "Out", revenue: 11500 },
  { month: "Nov", revenue: 14200 },
  { month: "Dez", revenue: 15750 },
]

const mockOverdueClients = [
  { name: "Empresa ABC", value: "R$ 5.000,00", daysOverdue: 15 },
  { name: "João Silva", value: "R$ 1.200,00", daysOverdue: 7 },
  { name: "Maria Santos", value: "R$ 800,00", daysOverdue: 3 },
]

export default function Reports() {
  const navigate = useNavigate()
  
  // Count-up animations for metrics
  const monthlyRevenue = useCountUp(15750, 800)
  const receivedAmount = useCountUp(12580, 800)
  const overdueAmount = useCountUp(7000, 800)

  const handleExportCSV = () => {
    // Here you would implement CSV export logic
    alert("Relatório CSV exportado com sucesso!")
  }

  const handleExportPDF = () => {
    // Here you would implement PDF export logic
    alert("Relatório PDF exportado com sucesso!")
  }

  const getDaysOverdueBadge = (days: number) => {
    if (days > 10) {
      return <Badge className="bg-destructive/20 text-destructive border-destructive/30">{days} dias</Badge>
    } else if (days > 5) {
      return <Badge className="bg-warning/20 text-warning border-warning/30">{days} dias</Badge>
    } else {
      return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">{days} dias</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="p-2 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios 📊</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho do seu negócio</p>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2 justify-end">
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary currency">
              {formatCurrency(monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">+12% em relação ao mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebimentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary currency">
              {formatCurrency(receivedAmount)}
            </div>
            <p className="text-xs text-muted-foreground">80% do faturamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive currency">
              {formatCurrency(overdueAmount)}
            </div>
            <p className="text-xs text-muted-foreground">3 clientes em atraso</p>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart with animation */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Faturamento por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 animate-[slideInUp_0.6s_ease-out_0.2s_both]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `R$ ${value.toLocaleString()}`}
                />
                <Tooltip 
                  formatter={(value) => [`R$ ${value.toLocaleString()}`, 'Faturamento']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  className="animate-[fillUp_0.8s_ease-out_0.4s_both]"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes em Atraso</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Dias em Atraso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOverdueClients.map((client, index) => (
                <TableRow 
                  key={index}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => navigate("/finance/receivables")}
                >
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="font-medium">{client.value}</TableCell>
                  <TableCell>
                    {getDaysOverdueBadge(client.daysOverdue)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate("/finance/receivables")
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}