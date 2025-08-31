-- Backfill profiles for existing users
INSERT INTO public.profiles (id, email)
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Associate specific users to PRIMEGESTOR organization
WITH org AS (
  SELECT id FROM public.organizations 
  WHERE lower(slug) = 'primegestor' OR lower(name) = 'primegestor'
  ORDER BY created_at DESC
  LIMIT 1
), target_users AS (
  SELECT id, email FROM auth.users 
  WHERE email IN ('sergio@primegestor.com.br','mario@primegestor.com.br')
)
INSERT INTO public.user_organizations (user_id, org_id, role)
SELECT tu.id, o.id, 'owner'
FROM target_users tu CROSS JOIN org o
WHERE o.id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.user_organizations uo
  WHERE uo.user_id = tu.id AND uo.org_id = o.id
);
