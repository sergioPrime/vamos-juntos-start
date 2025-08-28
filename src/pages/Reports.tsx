import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, DollarSign, AlertTriangle, Calendar } from "lucide-react"

const mockOverdueClients = [
  { name: "Empresa ABC", value: "R$ 5.000,00", daysOverdue: 15 },
  { name: "João Silva", value: "R$ 1.200,00", daysOverdue: 7 },
  { name: "Maria Santos", value: "R$ 800,00", daysOverdue: 3 },
]

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">Acompanhe o desempenho do seu negócio</p>
      </div>

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ 15.750,00</div>
            <p className="text-xs text-muted-foreground">+12% em relação ao mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebimentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ 12.580,00</div>
            <p className="text-xs text-muted-foreground">80% do faturamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">R$ 7.000,00</div>
            <p className="text-xs text-muted-foreground">3 clientes em atraso</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Faturamento por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center bg-muted/10">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Gráfico de faturamento mensal será exibido aqui
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Integração com biblioteca de gráficos em desenvolvimento
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de inadimplentes */}
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
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOverdueClients.map((client, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.value}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      client.daysOverdue > 10 ? 'bg-red-100 text-red-800' :
                      client.daysOverdue > 5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {client.daysOverdue} dias
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button className="text-primary hover:underline text-sm">Enviar cobrança</button>
                      <button className="text-primary hover:underline text-sm">Contatar</button>
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