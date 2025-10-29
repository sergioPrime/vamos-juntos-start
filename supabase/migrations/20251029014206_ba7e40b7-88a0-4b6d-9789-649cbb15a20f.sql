-- Remove o valor padrão da coluna entry_code para permitir que o trigger gere códigos sequenciais
ALTER TABLE public.financial_entries
  ALTER COLUMN entry_code DROP DEFAULT;

-- Adiciona comentário explicativo
COMMENT ON COLUMN public.financial_entries.entry_code IS 'Código sequencial do lançamento por organização. Gerado automaticamente pelo trigger set_entry_code.';