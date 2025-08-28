import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Payables() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contas a Pagar</h1>
        <p className="text-muted-foreground">Gerencie suas despesas e pagamentos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contas a Pagar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Funcionalidade em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  )
}