-- Add entry_code column to financial_entries table
ALTER TABLE public.financial_entries 
ADD COLUMN entry_code SERIAL;

-- Create function to generate next entry code
CREATE OR REPLACE FUNCTION public.generate_next_entry_code(p_org_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  next_code INTEGER;
BEGIN
  -- Find the highest entry code for the organization
  SELECT COALESCE(MAX(entry_code), 0) + 1
  INTO next_code
  FROM public.financial_entries
  WHERE org_id = p_org_id;
  
  RETURN next_code;
END;
$function$

-- Create trigger to auto-assign entry code on insert
CREATE OR REPLACE FUNCTION public.set_entry_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.entry_code IS NULL THEN
    NEW.entry_code := public.generate_next_entry_code(NEW.org_id);
  END IF;
  
  RETURN NEW;
END;
$function$

-- Create the trigger
CREATE TRIGGER set_entry_code_trigger
  BEFORE INSERT ON public.financial_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_entry_code();