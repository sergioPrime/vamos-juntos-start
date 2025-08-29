import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowLeft, TrendingUp, DollarSign, AlertTriangle, Download, Eye } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useCountUp, formatCurrency } from "@/hooks/useCountUp"
import { ResponsiveTable } from "@/components/ui/responsive-table"


export default function Reports() {
  const navigate = useNavigate()
  
  // Count-up animations for metrics
  const monthlyRevenue = useCountUp(0, 800)
  const receivedAmount = useCountUp(0, 800)
  const overdueAmount = useCountUp(0, 800)

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
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Relatórios 📊</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Acompanhe o desempenho do seu negócio</p>
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

      {/* Métricas principais - responsive */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Bar Chart with animation - responsive */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Faturamento por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Dados de receita não disponíveis</p>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Clients Table - responsive */}
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
                <TableHead>Valor</TableHead>
                <TableHead>Dias em Atraso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum cliente em atraso encontrado
                </TableCell>
              </TableRow>
            </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>
    </div>
  )
}