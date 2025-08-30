-- Adicionar o usuário sergio@primegestor.com.br como superadmin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::app_role
FROM auth.users 
WHERE email = 'sergio@primegestor.com.br'
ON CONFLICT (user_id, role) DO NOTHING;