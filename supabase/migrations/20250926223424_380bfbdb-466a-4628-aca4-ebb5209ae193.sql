-- Fix remaining functions that need SET search_path = 'public'

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Note: has_role function already has SET search_path = 'public'

-- Fix the pg_trgm extension functions that may not have search_path set
-- Note: These are built-in extension functions, so we cannot modify them
-- The pg_trgm functions like set_limit, show_limit, etc. are from the extension
-- and cannot be modified with SET search_path