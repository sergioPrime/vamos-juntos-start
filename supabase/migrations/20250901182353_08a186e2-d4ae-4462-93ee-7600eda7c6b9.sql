-- Insert default company "primegestor" if it doesn't exist
INSERT INTO public.companies (
  id,
  name,
  org_id,
  is_default,
  is_active,
  country,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  'primegestor',
  id,
  true,
  true,
  'BR',
  now(),
  now()
FROM public.organizations 
WHERE name = 'primegestor'
AND NOT EXISTS (
  SELECT 1 FROM public.companies 
  WHERE name = 'primegestor' 
  AND org_id = organizations.id
);