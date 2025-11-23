-- Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Política: Apenas super admins podem ler configurações
CREATE POLICY "Super admins can read system config"
  ON public.system_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.role = 'super_admin'
    )
  );

-- Política: Apenas super admins podem inserir configurações
CREATE POLICY "Super admins can insert system config"
  ON public.system_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.role = 'super_admin'
    )
  );

-- Política: Apenas super admins podem atualizar configurações
CREATE POLICY "Super admins can update system config"
  ON public.system_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.role = 'super_admin'
    )
  );

-- Política: Apenas super admins podem deletar configurações
CREATE POLICY "Super admins can delete system config"
  ON public.system_config
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.role = 'super_admin'
    )
  );

-- Criar índices
CREATE INDEX idx_system_config_key ON public.system_config(config_key);
CREATE INDEX idx_system_config_is_public ON public.system_config(is_public);

-- Inserir configurações padrão
INSERT INTO public.system_config (config_key, config_value, description, is_public) VALUES
  ('email.smtp_host', '""', 'Servidor SMTP para envio de emails', false),
  ('email.smtp_port', '"587"', 'Porta do servidor SMTP', false),
  ('email.from_name', '"PrimeGestor"', 'Nome do remetente padrão', false),
  ('notification.enable_email_notifications', 'true', 'Habilitar notificações por email', false),
  ('notification.enable_push_notifications', 'false', 'Habilitar notificações push', false),
  ('notification.notification_retention_days', '30', 'Dias de retenção de notificações', false),
  ('security.session_timeout_minutes', '480', 'Timeout de sessão em minutos', false),
  ('security.max_login_attempts', '5', 'Máximo de tentativas de login', false),
  ('security.password_min_length', '8', 'Tamanho mínimo de senha', false),
  ('maintenance.maintenance_mode', 'false', 'Modo de manutenção ativo', true)
ON CONFLICT (config_key) DO NOTHING;