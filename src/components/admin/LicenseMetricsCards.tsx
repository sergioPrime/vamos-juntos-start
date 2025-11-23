import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSubscriptionMetrics } from '@/hooks/useSubscriptionMetrics'
import { AlertTriangle, Calendar, Clock, Plus, Building2, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateLicenseDialog } from './CreateLicenseDialog'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function LicenseMetricsCards() {
  const { data: metrics, isLoading } = useSubscriptionMetrics()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const expiredCount = metrics?.expired.length || 0
  const expiringTodayCount = metrics?.expiringToday.length || 0
  const expiring7DaysCount = metrics?.expiringNext7Days.length || 0

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Licenças Vencidas */}
        <Card className="border-destructive/50 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/licenses?filter=expired')}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Licenças Vencidas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{expiredCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requer ação imediata
            </p>
            {expiredCount > 0 && (
              <div className="mt-3">
                <Badge variant="destructive" className="text-xs">
                  Crítico
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Licenças Vencendo Hoje */}
        <Card className="border-orange-500/50 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/licenses?filter=today')}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Vencendo Hoje</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{expiringTodayCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
            </p>
            {expiringTodayCount > 0 && (
              <div className="mt-3">
                <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                  Urgente
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Licenças Vencendo em 7 Dias */}
        <Card className="border-yellow-500/50 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/licenses?filter=next7days')}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Próximos 7 Dias</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{expiring7DaysCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Planejamento necessário
            </p>
            {expiring7DaysCount > 0 && (
              <div className="mt-3">
                <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500">
                  Atenção
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cadastrar Nova Licença */}
        <Card className="border-primary/50 bg-primary/5 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowCreateDialog(true)}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Nova Licença</CardTitle>
              <Plus className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Ação rápida
            </p>
          </CardContent>
        </Card>

        {/* Total de Organizações */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Organizações</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalOrganizations || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total cadastradas
            </p>
          </CardContent>
        </Card>

        {/* Total de Usuários */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total no sistema
            </p>
          </CardContent>
        </Card>
      </div>

      <CreateLicenseDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
    </>
  )
}
