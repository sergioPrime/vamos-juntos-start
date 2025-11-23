import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlanManagement } from "@/components/admin/PlanManagement"
import { AdminAnalytics } from "@/components/admin/AdminAnalytics"
import { AdminAuditLogs } from "@/components/admin/AdminAuditLogs"
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell"
import { AdminNotificationsPanel } from "@/components/admin/AdminNotificationsPanel"
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel"
import { SystemConfigPanel } from "@/components/admin/SystemConfigPanel"
import { useSuperAdmin } from "@/hooks/useSuperAdmin"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { Shield, Lock, BarChart3, FileText, Bell, Users, Settings } from "lucide-react"

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
            <p className="text-muted-foreground">
              Gerencie planos, usuários e configurações do sistema
            </p>
          </div>
        </div>
        <AdminNotificationBell />
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            <Shield className="h-4 w-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <FileText className="h-4 w-4" />
            Auditoria
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="plans" className="mt-6">
          <PlanManagement />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <AdminUsersPanel />
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <SystemConfigPanel />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AdminAuditLogs />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <AdminNotificationsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}