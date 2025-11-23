import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Calendar, Clock, Plus } from "lucide-react"
import { useSubscriptionMetrics } from "@/hooks/useSubscriptionMetrics"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface LicenseMetricsCardsProps {
  onCreateLicense: () => void
}

export function LicenseMetricsCards({ onCreateLicense }: LicenseMetricsCardsProps) {
  const { data: metrics, isLoading } = useSubscriptionMetrics()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Licenças Vencidas */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Licenças Vencidas
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {metrics?.expired || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Requer ação imediata
          </p>
        </CardContent>
      </Card>

      {/* Vencendo Hoje */}
      <Card className="border-orange-500/50 bg-orange-500/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Vencendo Hoje
          </CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">
            {metrics?.expiringToday || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Vence nas próximas 24h
          </p>
        </CardContent>
      </Card>

      {/* Próximos 7 Dias */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Próximos 7 Dias
          </CardTitle>
          <Calendar className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-500">
            {metrics?.expiringNext7Days || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Requer atenção em breve
          </p>
        </CardContent>
      </Card>

      {/* Cadastrar Nova Licença */}
      <Card className="border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer" onClick={onCreateLicense}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Nova Licença
          </CardTitle>
          <Plus className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <Button 
            variant="default" 
            className="w-full"
            onClick={onCreateLicense}
          >
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Ação rápida
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
