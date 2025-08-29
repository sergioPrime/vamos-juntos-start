import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Charges() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bora cobrar esse cliente? 💸</h1>
        <p className="text-muted-foreground">Manda um Pix e resolve na hora</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Cobranças</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Funcionalidade em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  )
}