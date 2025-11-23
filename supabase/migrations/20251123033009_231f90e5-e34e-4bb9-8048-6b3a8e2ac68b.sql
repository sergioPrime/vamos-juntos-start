-- Criar tabela de auditoria de ações administrativas
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT,
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'activate', 'deactivate'
  entity_type TEXT NOT NULL, -- 'subscription_plan', 'user_role', 'webhook', 'organization'
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_admin_audit_logs_org_id ON public.admin_audit_logs(org_id);
CREATE INDEX idx_admin_audit_logs_user_id ON public.admin_audit_logs(user_id);
CREATE INDEX idx_admin_audit_logs_action_type ON public.admin_audit_logs(action_type);
CREATE INDEX idx_admin_audit_logs_entity_type ON public.admin_audit_logs(entity_type);
CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Apenas superadmins podem ver logs
CREATE POLICY "Superadmins can view all audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Política: Sistema pode inserir logs (sem verificação de usuário)
CREATE POLICY "System can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Função para criar log de auditoria
CREATE OR REPLACE FUNCTION public.create_admin_audit_log(
  p_org_id UUID,
  p_action_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_user_email TEXT;
BEGIN
  -- Buscar email do usuário atual
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Inserir log
  INSERT INTO public.admin_audit_logs (
    org_id,
    user_id,
    user_email,
    action_type,
    entity_type,
    entity_id,
    old_values,
    new_values,
    metadata
  ) VALUES (
    p_org_id,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
    v_user_email,
    p_action_type,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Trigger para auditar mudanças em planos de assinatura
CREATE OR REPLACE FUNCTION public.audit_subscription_plans_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.create_admin_audit_log(
      NULL, -- planos são globais
      'update',
      'subscription_plan',
      NEW.id,
      row_to_json(OLD)::JSONB,
      row_to_json(NEW)::JSONB,
      jsonb_build_object(
        'changed_fields', (
          SELECT jsonb_object_agg(key, value)
          FROM jsonb_each(row_to_json(NEW)::JSONB)
          WHERE row_to_json(NEW)::JSONB->>key IS DISTINCT FROM row_to_json(OLD)::JSONB->>key
        )
      )
    );
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.create_admin_audit_log(
      NULL,
      'create',
      'subscription_plan',
      NEW.id,
      NULL,
      row_to_json(NEW)::JSONB,
      NULL
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.create_admin_audit_log(
      NULL,
      'delete',
      'subscription_plan',
      OLD.id,
      row_to_json(OLD)::JSONB,
      NULL,
      NULL
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger em subscription_plans
DROP TRIGGER IF EXISTS audit_subscription_plans_trigger ON public.subscription_plans;
CREATE TRIGGER audit_subscription_plans_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_subscription_plans_changes();

-- Trigger para auditar mudanças em roles de usuários
CREATE OR REPLACE FUNCTION public.audit_user_roles_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.create_admin_audit_log(
      NULL,
      'update',
      'user_role',
      NEW.id,
      row_to_json(OLD)::JSONB,
      row_to_json(NEW)::JSONB,
      jsonb_build_object('role_changed', OLD.role != NEW.role)
    );
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.create_admin_audit_log(
      NULL,
      'create',
      'user_role',
      NEW.id,
      NULL,
      row_to_json(NEW)::JSONB,
      jsonb_build_object('role_granted', NEW.role)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.create_admin_audit_log(
      NULL,
      'delete',
      'user_role',
      OLD.id,
      row_to_json(OLD)::JSONB,
      NULL,
      jsonb_build_object('role_revoked', OLD.role)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger em user_roles
DROP TRIGGER IF EXISTS audit_user_roles_trigger ON public.user_roles;
CREATE TRIGGER audit_user_roles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_user_roles_changes();

COMMENT ON TABLE public.admin_audit_logs IS 'Registra todas as ações administrativas críticas para auditoria e compliance';
COMMENT ON FUNCTION public.create_admin_audit_log IS 'Função auxiliar para criar registros de auditoria de forma padronizada';