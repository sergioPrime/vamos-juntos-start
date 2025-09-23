-- Ensure min_stock_level is properly handled as numeric
-- First, set all NULL values to 0
UPDATE public.products 
SET min_stock_level = 0 
WHERE min_stock_level IS NULL;

-- Set default value for future inserts
ALTER TABLE public.products 
ALTER COLUMN min_stock_level SET DEFAULT 0;