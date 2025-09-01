-- Ensure unique slugs on organizations to prevent duplicate key errors during user creation triggers
-- Create or replace function and trigger

-- Function to normalize and ensure unique slug
CREATE OR REPLACE FUNCTION public.ensure_unique_organization_slug()
RETURNS trigger AS $$
DECLARE
  base_slug text;
  candidate text;
  suffix int := 1;
BEGIN
  -- Determine base slug from provided slug or name
  base_slug := coalesce(NULLIF(trim(NEW.slug), ''), NEW.name);
  base_slug := lower(trim(regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g')));

  IF base_slug IS NULL OR base_slug = '' THEN
    -- fallback random slug
    base_slug := encode(gen_random_bytes(4), 'hex');
  END IF;

  candidate := base_slug;

  -- If the slug is already taken by another record, append a numeric suffix until it's unique
  WHILE EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.slug = candidate AND (TG_OP = 'INSERT' OR o.id <> NEW.id)
  ) LOOP
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix::text;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to run before insert or when slug/name changes
DROP TRIGGER IF EXISTS ensure_unique_organization_slug_trigger ON public.organizations;
CREATE TRIGGER ensure_unique_organization_slug_trigger
BEFORE INSERT OR UPDATE OF slug, name ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.ensure_unique_organization_slug();