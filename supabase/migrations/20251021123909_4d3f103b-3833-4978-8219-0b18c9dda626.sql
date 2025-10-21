-- Criar tabela de solicitações de acesso
CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  module_key TEXT NOT NULL,
  permissions JSONB NOT NULL,
  justification TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  organization_id UUID NOT NULL,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_requests" ON access_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admins_view_all_requests" ON access_requests
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
  );

CREATE POLICY "users_create_requests" ON access_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_update_requests" ON access_requests
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_access_requests_user ON access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_org ON access_requests(organization_id);

-- Function aprovar
CREATE OR REPLACE FUNCTION approve_access_request(
  request_id UUID,
  reviewer_id UUID,
  notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_module_key TEXT;
  v_permissions JSONB;
  v_org_id UUID;
BEGIN
  SELECT user_id, module_key, permissions, organization_id
  INTO v_user_id, v_module_key, v_permissions, v_org_id
  FROM access_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;

  UPDATE access_requests
  SET status = 'approved',
      reviewed_at = now(),
      reviewed_by = reviewer_id,
      review_notes = notes
  WHERE id = request_id;

  INSERT INTO module_permissions (user_id, module_key, can_create, can_read, can_update, can_delete, org_id)
  VALUES (
    v_user_id,
    v_module_key,
    COALESCE((v_permissions->>'can_create')::BOOLEAN, false),
    COALESCE((v_permissions->>'can_read')::BOOLEAN, false),
    COALESCE((v_permissions->>'can_update')::BOOLEAN, false),
    COALESCE((v_permissions->>'can_delete')::BOOLEAN, false),
    v_org_id
  )
  ON CONFLICT (user_id, module_key, org_id)
  DO UPDATE SET
    can_create = EXCLUDED.can_create OR module_permissions.can_create,
    can_read = EXCLUDED.can_read OR module_permissions.can_read,
    can_update = EXCLUDED.can_update OR module_permissions.can_update,
    can_delete = EXCLUDED.can_delete OR module_permissions.can_delete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function rejeitar
CREATE OR REPLACE FUNCTION reject_access_request(
  request_id UUID,
  reviewer_id UUID,
  notes TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE access_requests
  SET status = 'rejected',
      reviewed_at = now(),
      reviewed_by = reviewer_id,
      review_notes = notes
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;