import { useAuth } from '@/hooks/useAuth';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Shield } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LicenseMetricsCards } from '@/components/admin/LicenseMetricsCards';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminNotifications } from '@/components/admin/AdminNotifications';
import { AdminUsersManagement } from '@/components/admin/AdminUsersManagement';
import { AdminOrganizationsManagement } from '@/components/admin/AdminOrganizationsManagement';
import { AdminAuditLogs } from '@/components/admin/AdminAuditLogs';

export default function AdminDashboard() {
  const { user } = useAuth()
  const { isSuperAdmin, loading } = useSuperAdmin()
  const navigate = useNavigate()

  useEffect(() => {
    // Se não tiver usuário logado, redireciona para login
    if (!loading && !user) {
      navigate("/auth")
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
          <div>
            <h2 className="text-xl font-semibold">Verificando Permissões</h2>
            <p className="text-muted-foreground">
              Aguarde enquanto verificamos seus privilégios de acesso...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-6">
          <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center">
            <Lock className="h-12 w-12 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
            <p className="text-muted-foreground max-w-md">
              Você não possui privilégios de Super Administrador necessários para acessar o painel administrativo.
            </p>
          </div>
          
          <Card className="max-w-md mx-auto border-destructive/20">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Acesso restrito a Super Administradores</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Se você acredita que deveria ter acesso, entre em contato com um administrador do sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Gestão completa do sistema PrimeGestor
          </p>
        </div>
      </div>

      <LicenseMetricsCards />

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="organizations">Organizações</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsersManagement />
        </TabsContent>

        <TabsContent value="organizations">
          <AdminOrganizationsManagement />
        </TabsContent>

        <TabsContent value="audit">
          <AdminAuditLogs />
        </TabsContent>

        <TabsContent value="notifications">
          <AdminNotifications />
        </TabsContent>
      </Tabs>
    </div>
  )
}