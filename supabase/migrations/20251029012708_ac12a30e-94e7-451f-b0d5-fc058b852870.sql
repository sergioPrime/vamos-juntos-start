-- Tornar person_id nullable na tabela financial_entries
-- Necessário para permitir vendas do PDV sem cliente identificado
ALTER TABLE public.financial_entries 
  ALTER COLUMN person_id DROP NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.financial_entries.person_id IS 'ID do cliente ou fornecedor. Pode ser NULL para vendas sem cliente identificado (ex: PDV consumidor final)';