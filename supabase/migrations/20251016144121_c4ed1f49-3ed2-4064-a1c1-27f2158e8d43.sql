-- Fix COALESCE type mismatch error in products table
-- The issue is likely in the set_product_system_code trigger or a default value

-- First, let's check and fix the trigger if it exists
DROP TRIGGER IF EXISTS set_product_system_code_trigger ON public.products;

-- Recreate the trigger function to handle types correctly
CREATE OR REPLACE FUNCTION public.set_product_system_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only set system_code if it's null, and ensure we're working with integers
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