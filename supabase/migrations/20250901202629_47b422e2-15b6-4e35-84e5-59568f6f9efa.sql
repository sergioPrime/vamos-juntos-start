-- Remover o trigger que cria automaticamente uma organização para cada usuário
-- pois agora queremos que todos os novos usuários sejam associados à empresa padrão

DROP TRIGGER IF EXISTS on_auth_user_created_organization ON auth.users;
DROP FUNCTION IF EXISTS public.create_user_organization();