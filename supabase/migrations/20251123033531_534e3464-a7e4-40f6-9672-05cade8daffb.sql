-- Tabela de notificações admin
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
  metadata JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Índices para melhor performance
CREATE INDEX idx_admin_notifications_org_id ON public.admin_notifications(org_id);
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notifications_is_read ON public.admin_notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_admin_notifications_type ON public.admin_notifications(notification_type);

-- RLS Policies (apenas superadmins)
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins podem visualizar todas notificações"
  ON public.admin_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins podem marcar como lida"
  ON public.admin_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'superadmin'
    )
  );

CREATE POLICY "Sistema pode criar notificações"
  ON public.admin_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Função para limpar notificações expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.admin_notifications
  WHERE expires_at IS NOT NULL 
    AND expires_at < now();
END;
$$;

-- Função para criar notificação automática de novo plano
CREATE OR REPLACE FUNCTION public.notify_new_subscription_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (
    notification_type,
    title,
    message,
    severity,
    metadata,
    action_url
  ) VALUES (
    'new_plan',
    'Novo Plano de Assinatura',
    'Um novo plano "' || NEW.name || '" foi criado.',
    'info',
    jsonb_build_object('plan_id', NEW.id, 'plan_name', NEW.name),
    '/admin'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar novos planos
DROP TRIGGER IF EXISTS notify_new_plan_trigger ON public.subscription_plans;
CREATE TRIGGER notify_new_plan_trigger
  AFTER INSERT ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_subscription_plan();

-- Função para criar notificação de nova organização
CREATE OR REPLACE FUNCTION public.notify_new_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (
    org_id,
    notification_type,
    title,
    message,
    severity,
    metadata,
    action_url
  ) VALUES (
    NEW.id,
    'new_organization',
    'Nova Organização Registrada',
    'A organização "' || NEW.name || '" foi criada.',
    'success',
    jsonb_build_object('org_id', NEW.id, 'org_name', NEW.name, 'org_slug', NEW.slug),
    '/admin'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar novas organizações
DROP TRIGGER IF EXISTS notify_new_org_trigger ON public.organizations;
CREATE TRIGGER notify_new_org_trigger
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_organization();