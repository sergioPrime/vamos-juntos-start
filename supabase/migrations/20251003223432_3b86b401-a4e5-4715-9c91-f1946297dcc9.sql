-- Create module_permissions table
CREATE TABLE IF NOT EXISTS public.module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_read BOOLEAN NOT NULL DEFAULT false,
  can_update BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id, module_key)
);

-- Create feature_permissions table
CREATE TABLE IF NOT EXISTS public.feature_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_read BOOLEAN NOT NULL DEFAULT false,
  can_update BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id, feature_key)
);

-- Enable RLS
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_permissions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_module_permissions_org_user ON public.module_permissions(org_id, user_id);
CREATE INDEX idx_module_permissions_module ON public.module_permissions(module_key);
CREATE INDEX idx_feature_permissions_org_user ON public.feature_permissions(org_id, user_id);
CREATE INDEX idx_feature_permissions_feature ON public.feature_permissions(feature_key);

-- Function to check module permissions
CREATE OR REPLACE FUNCTION public.has_module_permission(
  _user_id UUID,
  _org_id UUID,
  _module_key TEXT,
  _permission_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
  has_permission BOOLEAN;
BEGIN
  -- Check if user is admin or superadmin (they have all permissions)
  SELECT has_role(_user_id, 'admin'::app_role) OR has_role(_user_id, 'superadmin'::app_role)
  INTO is_admin;
  
  IF is_admin THEN
    RETURN true;
  END IF;
  
  -- Check specific module permission
  IF _permission_type = 'create' THEN
    SELECT can_create INTO has_permission
    FROM public.module_permissions
    WHERE user_id = _user_id AND org_id = _org_id AND module_key = _module_key;
  ELSIF _permission_type = 'read' THEN
    SELECT can_read INTO has_permission
    FROM public.module_permissions
    WHERE user_id = _user_id AND org_id = _org_id AND module_key = _module_key;
  ELSIF _permission_type = 'update' THEN
    SELECT can_update INTO has_permission
    FROM public.module_permissions
    WHERE user_id = _user_id AND org_id = _org_id AND module_key = _module_key;
  ELSIF _permission_type = 'delete' THEN
    SELECT can_delete INTO has_permission
    FROM public.module_permissions
    WHERE user_id = _user_id AND org_id = _org_id AND module_key = _module_key;
  ELSE
    RETURN false;
  END IF;
  
  RETURN COALESCE(has_permission, false);
END;
$$;

-- Function to check feature permissions
CREATE OR REPLACE FUNCTION public.has_feature_permission(
  _user_id UUID,
  _org_id UUID,
  _feature_key TEXT,
  _permission_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
  has_permission BOOLEAN;
BEGIN
  -- Check if user is admin or superadmin (they have all permissions)
  SELECT has_role(_user_id, 'admin'::app_role) OR has_role(_user_id, 'superadmin'::app_role)
  INTO is_admin;
  
  IF is_admin THEN
    RETURN true;
  END IF;
  
  -- Check specific feature permission
  IF _permission_type = 'create' THEN
    SELECT can_create INTO has_permission
    FROM public.feature_permissions
    WHERE user_id = _user_id AND org_id = _org_id AND feature_key = _feature_key;
  ELSIF _permission_type = 'read' THEN
    SELECT can_read INTO has_permission
    FROM public.feature_permissions
    WHERE user_id = _user_id AND org_id = _org_id AND feature_key = _feature_key;
  ELSIF _permission_type = 'update' THEN
    SELECT can_update INTO has_permission
    FROM public.feature_permissions
    WHERE user_id = _user_id AND org_id = _org_id AND feature_key = _feature_key;
  ELSIF _permission_type = 'delete' THEN
    SELECT can_delete INTO has_permission
    FROM public.feature_permissions
    WHERE user_id = _user_id AND org_id = _org_id AND feature_key = _feature_key;
  ELSE
    RETURN false;
  END IF;
  
  RETURN COALESCE(has_permission, false);
END;
$$;

-- RLS Policies for module_permissions
CREATE POLICY "Users can view their own module permissions"
ON public.module_permissions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all module permissions"
ON public.module_permissions
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- RLS Policies for feature_permissions
CREATE POLICY "Users can view their own feature permissions"
ON public.feature_permissions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all feature permissions"
ON public.feature_permissions
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- Triggers for updated_at
CREATE TRIGGER update_module_permissions_updated_at
BEFORE UPDATE ON public.module_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_permissions_updated_at
BEFORE UPDATE ON public.feature_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();