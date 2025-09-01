-- Remover o trigger e a função que cria automaticamente uma organização para cada usuário
-- usando CASCADE para remover todas as dependências

DROP FUNCTION IF EXISTS public.create_user_organization() CASCADE;