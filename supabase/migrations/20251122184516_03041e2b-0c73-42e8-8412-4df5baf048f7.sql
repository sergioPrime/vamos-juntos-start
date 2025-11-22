-- Sprint 4.4: Sistema de Auditoria Avançada (corrigido)

-- Adicionar campos à tabela transaction_audit existente
ALTER TABLE public.transaction_audit 
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS request_id TEXT;

-- Índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_transaction_audit_session_id ON public.transaction_audit(session_id);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_request_id ON public.transaction_audit(request_id);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_ip_address ON public.transaction_audit(ip_address);

-- Tabela de audit trail detalhada
CREATE TABLE IF NOT EXISTS public.audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para audit_trail
CREATE INDEX IF NOT EXISTS idx_audit_trail_org_id ON public.audit_trail(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON public.audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON public.audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON public.audit_trail(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON public.audit_trail(action);

-- RLS para audit_trail
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit trail of their org"
  ON public.audit_trail FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create audit trail"
  ON public.audit_trail FOR INSERT
  WITH CHECK (true);

-- View: Audit summary
CREATE OR REPLACE VIEW public.audit_summary AS
SELECT 
  org_id,
  DATE(event_timestamp) as audit_date,
  action,
  entity_type,
  COUNT(*) as action_count,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(event_timestamp) as first_action,
  MAX(event_timestamp) as last_action
FROM public.audit_trail
GROUP BY org_id, DATE(event_timestamp), action, entity_type;

-- Function: Log audit event
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_org_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_field_name TEXT DEFAULT NULL,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id UUID;
  v_user_email TEXT;
BEGIN
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  INSERT INTO public.audit_trail (
    org_id, entity_type, entity_id, action,
    field_name, old_value, new_value,
    user_id, user_email, metadata
  ) VALUES (
    p_org_id, p_entity_type, p_entity_id, p_action,
    p_field_name, p_old_value, p_new_value,
    auth.uid(), v_user_email, p_metadata
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- Function: Get audit timeline
CREATE OR REPLACE FUNCTION public.get_audit_timeline(
  p_org_id UUID,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
  id UUID,
  entity_type TEXT,
  entity_id UUID,
  action TEXT,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  user_email TEXT,
  event_timestamp TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.entity_type,
    a.entity_id,
    a.action,
    a.field_name,
    a.old_value,
    a.new_value,
    a.user_email,
    a.event_timestamp,
    a.ip_address,
    a.metadata
  FROM public.audit_trail a
  WHERE a.org_id = p_org_id
    AND (p_entity_type IS NULL OR a.entity_type = p_entity_type)
    AND (p_entity_id IS NULL OR a.entity_id = p_entity_id)
    AND (p_user_id IS NULL OR a.user_id = p_user_id)
    AND (p_start_date IS NULL OR a.event_timestamp >= p_start_date)
    AND (p_end_date IS NULL OR a.event_timestamp <= p_end_date)
  ORDER BY a.event_timestamp DESC
  LIMIT p_limit;
END;
$$;

-- Function: Export audit logs
CREATE OR REPLACE FUNCTION public.export_audit_logs(
  p_org_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(
  event_timestamp TEXT,
  user_email TEXT,
  action TEXT,
  entity_type TEXT,
  entity_id TEXT,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.event_timestamp::TEXT,
    a.user_email,
    a.action,
    a.entity_type,
    a.entity_id::TEXT,
    a.field_name,
    a.old_value,
    a.new_value,
    a.ip_address
  FROM public.audit_trail a
  WHERE a.org_id = p_org_id
    AND a.event_timestamp >= p_start_date
    AND a.event_timestamp <= p_end_date
  ORDER BY a.event_timestamp DESC;
END;
$$;

-- Function: Cleanup old audit logs
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(p_retention_days INTEGER DEFAULT 365)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.audit_trail
    WHERE event_timestamp < now() - (p_retention_days || ' days')::INTERVAL
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  RETURN v_deleted_count;
END;
$$;