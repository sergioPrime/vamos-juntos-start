-- Adicionar coluna system_code na tabela products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS system_code INTEGER;

-- Criar sequência para system_code por organização
CREATE OR REPLACE FUNCTION public.generate_next_system_code(p_org_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_code INTEGER;
BEGIN
  SELECT COALESCE(MAX(system_code), 0) + 1
  INTO next_code
  FROM public.products
  WHERE org_id = p_org_id;
  
  RETURN next_code;
END;
$$;

-- Criar trigger para definir system_code automaticamente
CREATE OR REPLACE FUNCTION public.set_product_system_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.system_code IS NULL THEN
    NEW.system_code := public.generate_next_system_code(NEW.org_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_set_product_system_code ON public.products;
CREATE TRIGGER trigger_set_product_system_code
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_product_system_code();

-- Atualizar produtos existentes com system_code sequencial por organização
WITH numbered_products AS (
  SELECT 
    id,
    org_id,
    ROW_NUMBER() OVER (PARTITION BY org_id ORDER BY created_at, id) as row_num
  FROM public.products
  WHERE system_code IS NULL
)
UPDATE public.products p
SET system_code = np.row_num
FROM numbered_products np
WHERE p.id = np.id;