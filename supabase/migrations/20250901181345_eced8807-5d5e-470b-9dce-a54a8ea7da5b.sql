-- Add is_default column to companies table
ALTER TABLE public.companies 
ADD COLUMN is_default boolean NOT NULL DEFAULT false;

-- Ensure only one company per organization can be default
CREATE UNIQUE INDEX companies_org_default_unique 
ON public.companies (org_id) 
WHERE is_default = true;

-- Set "primegestor" company as default if it exists
UPDATE public.companies 
SET is_default = true 
WHERE LOWER(name) LIKE '%primegestor%' 
AND is_default = false;