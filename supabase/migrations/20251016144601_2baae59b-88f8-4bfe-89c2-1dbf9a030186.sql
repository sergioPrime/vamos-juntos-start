-- Fix the system_code generation function to return text instead of integer
DROP FUNCTION IF EXISTS public.generate_next_system_code(uuid);

CREATE OR REPLACE FUNCTION public.generate_next_system_code(p_org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  next_code INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(system_code AS INTEGER)), 0) + 1
  INTO next_code
  FROM public.products
  WHERE org_id = p_org_id
    AND system_code ~ '^[0-9]+$';
  
  -- Return as text
  RETURN next_code::text;
END;
$$;

-- Update the trigger function to handle the text return type
DROP TRIGGER IF EXISTS set_product_system_code_trigger ON public.products;

CREATE OR REPLACE FUNCTION public.set_product_system_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only set system_code if it's null
  IF NEW.system_code IS NULL THEN
    NEW.system_code := public.generate_next_system_code(NEW.org_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER set_product_system_code_trigger
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_product_system_code();