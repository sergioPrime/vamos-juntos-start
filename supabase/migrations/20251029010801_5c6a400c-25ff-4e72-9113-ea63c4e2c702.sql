-- Remove trigger inválido que tenta validar company_id na tabela orders
-- A tabela orders não possui a coluna company_id
DROP TRIGGER IF EXISTS trigger_validate_company_in_order ON orders;