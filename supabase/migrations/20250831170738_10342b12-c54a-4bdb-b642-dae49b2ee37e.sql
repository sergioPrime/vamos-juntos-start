-- Function to create organization and associate current user as owner
CREATE OR REPLACE FUNCTION public.create_organization_with_owner(org_name text, org_slug text)
RETURNS TABLE (id uuid, name text, slug text, created_at timestamptz, updated_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_org public.organizations%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING * INTO new_org;

  INSERT INTO public.user_organizations (user_id, org_id, role)
  VALUES (auth.uid(), new_org.id, 'owner');

  RETURN QUERY SELECT new_org.id, new_org.name, new_org.slug, new_org.created_at, new_org.updated_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_organization_with_owner(text, text) TO authenticated;