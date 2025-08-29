-- Corrigir o aviso de search_path mutable na função
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;