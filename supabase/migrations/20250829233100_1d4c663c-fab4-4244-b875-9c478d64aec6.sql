-- Criar tabela de organizações primeiro
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de organizações
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Criar tabela de relacionamento usuário-organização
CREATE TABLE public.user_organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, org_id)
);

-- Habilitar RLS na tabela de relacionamento
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- Agora adicionar as colunas necessárias para multi-tenancy na tabela customers
ALTER TABLE public.customers 
ADD COLUMN org_id UUID REFERENCES public.organizations(id),
ADD COLUMN owner_id UUID REFERENCES auth.users(id);

-- Remover as políticas públicas temporárias
DROP POLICY IF EXISTS "Public can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Public can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Public can read customers" ON public.customers;
DROP POLICY IF EXISTS "Public can update customers" ON public.customers;

-- Criar políticas de RLS baseadas em organização
CREATE POLICY "Users can view customers from their organization"
ON public.customers
FOR SELECT
TO authenticated
USING (org_id IN (
  SELECT org_id FROM public.user_organizations 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert customers for their organization"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM public.user_organizations 
    WHERE user_id = auth.uid()
  )
  AND owner_id = auth.uid()
);

CREATE POLICY "Users can update customers from their organization"
ON public.customers
FOR UPDATE
TO authenticated
USING (org_id IN (
  SELECT org_id FROM public.user_organizations 
  WHERE user_id = auth.uid()
))
WITH CHECK (org_id IN (
  SELECT org_id FROM public.user_organizations 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete customers from their organization"
ON public.customers
FOR DELETE
TO authenticated
USING (org_id IN (
  SELECT org_id FROM public.user_organizations 
  WHERE user_id = auth.uid()
));

-- Políticas para organizações
CREATE POLICY "Users can view their organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (id IN (
  SELECT org_id FROM public.user_organizations 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (id IN (
  SELECT org_id FROM public.user_organizations 
  WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
));

-- Políticas para user_organizations
CREATE POLICY "Users can view their organization memberships"
ON public.user_organizations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Triggers para updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar organização automática no signup
CREATE OR REPLACE FUNCTION public.create_user_organization()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Criar organização para o usuário
  INSERT INTO public.organizations (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'company_name', 'empresa-' || NEW.id::text), ' ', '-'))
  )
  RETURNING id INTO new_org_id;
  
  -- Adicionar usuário como owner da organização
  INSERT INTO public.user_organizations (user_id, org_id, role)
  VALUES (NEW.id, new_org_id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar organização quando usuário se cadastra
CREATE TRIGGER on_auth_user_created_org
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_organization();