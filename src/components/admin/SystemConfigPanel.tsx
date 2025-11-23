import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Settings, Mail, Bell, Shield, AlertTriangle, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function SystemConfigPanel() {
  const { configs, isLoading, updateConfig, isUpdating } = useSystemConfig();

  // Estados locais para as configurações
  const [emailConfig, setEmailConfig] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: 'PrimeGestor',
  });

  const [notificationConfig, setNotificationConfig] = useState({
    enable_email_notifications: true,
    enable_push_notifications: false,
    notification_retention_days: 30,
  });

  const [securityConfig, setSecurityConfig] = useState({
    session_timeout_minutes: 480,
    max_login_attempts: 5,
    require_2fa_for_admin: false,
    password_min_length: 8,
  });

  const [maintenanceConfig, setMaintenanceConfig] = useState({
    maintenance_mode: false,
    maintenance_message: '',
    maintenance_scheduled_at: '',
  });

  const handleSaveEmailConfig = () => {
    Object.entries(emailConfig).forEach(([key, value]) => {
      updateConfig({ key: `email.${key}`, value });
    });
  };

  const handleSaveNotificationConfig = () => {
    Object.entries(notificationConfig).forEach(([key, value]) => {
      updateConfig({ key: `notification.${key}`, value });
    });
  };

  const handleSaveSecurityConfig = () => {
    Object.entries(securityConfig).forEach(([key, value]) => {
      updateConfig({ key: `security.${key}`, value });
    });
  };

  const handleSaveMaintenanceConfig = () => {
    Object.entries(maintenanceConfig).forEach(([key, value]) => {
      updateConfig({ key: `maintenance.${key}`, value });
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <CardTitle>Configurações do Sistema</CardTitle>
        </div>
        <CardDescription>
          Gerencie configurações globais do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Manutenção
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="smtp_host">Servidor SMTP</Label>
                <Input
                  id="smtp_host"
                  placeholder="smtp.exemplo.com"
                  value={emailConfig.smtp_host}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtp_host: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smtp_port">Porta SMTP</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  placeholder="587"
                  value={emailConfig.smtp_port}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtp_port: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smtp_user">Usuário SMTP</Label>
                <Input
                  id="smtp_user"
                  placeholder="usuario@exemplo.com"
                  value={emailConfig.smtp_user}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtp_user: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smtp_password">Senha SMTP</Label>
                <Input
                  id="smtp_password"
                  type="password"
                  value={emailConfig.smtp_password}
                  onChange={(e) => setEmailConfig({ ...emailConfig, smtp_password: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="from_email">Email de Envio</Label>
                <Input
                  id="from_email"
                  placeholder="noreply@exemplo.com"
                  value={emailConfig.from_email}
                  onChange={(e) => setEmailConfig({ ...emailConfig, from_email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="from_name">Nome do Remetente</Label>
                <Input
                  id="from_name"
                  placeholder="PrimeGestor"
                  value={emailConfig.from_name}
                  onChange={(e) => setEmailConfig({ ...emailConfig, from_name: e.target.value })}
                />
              </div>
              <Button onClick={handleSaveEmailConfig} disabled={isUpdating} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Configurações de Email
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-6">
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificações importantes por email
                  </p>
                </div>
                <Switch
                  checked={notificationConfig.enable_email_notifications}
                  onCheckedChange={(checked) =>
                    setNotificationConfig({ ...notificationConfig, enable_email_notifications: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificações push no navegador
                  </p>
                </div>
                <Switch
                  checked={notificationConfig.enable_push_notifications}
                  onCheckedChange={(checked) =>
                    setNotificationConfig({ ...notificationConfig, enable_push_notifications: checked })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="retention_days">Dias de Retenção de Notificações</Label>
                <Input
                  id="retention_days"
                  type="number"
                  value={notificationConfig.notification_retention_days}
                  onChange={(e) =>
                    setNotificationConfig({
                      ...notificationConfig,
                      notification_retention_days: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <Button onClick={handleSaveNotificationConfig} disabled={isUpdating} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Configurações de Notificações
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-6">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="session_timeout">Timeout de Sessão (minutos)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  value={securityConfig.session_timeout_minutes}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      session_timeout_minutes: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max_attempts">Máximo de Tentativas de Login</Label>
                <Input
                  id="max_attempts"
                  type="number"
                  value={securityConfig.max_login_attempts}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      max_login_attempts: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password_length">Tamanho Mínimo de Senha</Label>
                <Input
                  id="password_length"
                  type="number"
                  value={securityConfig.password_min_length}
                  onChange={(e) =>
                    setSecurityConfig({
                      ...securityConfig,
                      password_min_length: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exigir 2FA para Administradores</Label>
                  <p className="text-sm text-muted-foreground">
                    Forçar autenticação de dois fatores para admins
                  </p>
                </div>
                <Switch
                  checked={securityConfig.require_2fa_for_admin}
                  onCheckedChange={(checked) =>
                    setSecurityConfig({ ...securityConfig, require_2fa_for_admin: checked })
                  }
                />
              </div>
              <Button onClick={handleSaveSecurityConfig} disabled={isUpdating} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Configurações de Segurança
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4 mt-6">
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo de Manutenção</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar modo de manutenção do sistema
                  </p>
                </div>
                <Switch
                  checked={maintenanceConfig.maintenance_mode}
                  onCheckedChange={(checked) =>
                    setMaintenanceConfig({ ...maintenanceConfig, maintenance_mode: checked })
                  }
                />
              </div>
              {maintenanceConfig.maintenance_mode && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="maintenance_message">Mensagem de Manutenção</Label>
                    <Textarea
                      id="maintenance_message"
                      placeholder="O sistema está em manutenção. Voltaremos em breve."
                      value={maintenanceConfig.maintenance_message}
                      onChange={(e) =>
                        setMaintenanceConfig({
                          ...maintenanceConfig,
                          maintenance_message: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="scheduled_at">Manutenção Programada</Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      value={maintenanceConfig.maintenance_scheduled_at}
                      onChange={(e) =>
                        setMaintenanceConfig({
                          ...maintenanceConfig,
                          maintenance_scheduled_at: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}
              <Button onClick={handleSaveMaintenanceConfig} disabled={isUpdating} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Configurações de Manutenção
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
