-- Fix remaining SECURITY DEFINER functions that don't have SET search_path

-- This function is from the pg_trgm extension and should have search_path set
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

-- The pg_trgm extension functions cannot be modified as they are system functions
-- These include functions like set_limit, show_limit, similarity, etc.
-- They are part of the PostgreSQL extension and should not be altered

-- Note: The remaining WARN messages about function search_path mutable 
-- are likely for the pg_trgm extension functions which cannot be modified
-- These are system-level functions from PostgreSQL extensions