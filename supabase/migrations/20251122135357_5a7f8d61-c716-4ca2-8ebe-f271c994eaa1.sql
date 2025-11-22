-- Adicionar coluna NCM à tabela products
ALTER TABLE products ADD COLUMN IF NOT EXISTS ncm_code TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN products.ncm_code IS 'Nomenclatura Comum do Mercosul - Código de classificação fiscal do produto';