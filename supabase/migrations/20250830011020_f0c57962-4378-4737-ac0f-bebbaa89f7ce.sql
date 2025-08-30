-- Ensure RLS allows users to read their own roles and promote the specified user to superadmin

-- Enable RLS on user_roles (safe if already enabled)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Replace existing SELECT policy if present
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Grant superadmin role to the specified user by email (idempotent)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::app_role
FROM auth.users
WHERE email = 'sergio@primegestor.com.br'
ON CONFLICT (user_id, role) DO NOTHING;