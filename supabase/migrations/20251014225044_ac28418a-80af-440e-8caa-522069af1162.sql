-- Add company_id to warehouses table
ALTER TABLE public.warehouses 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_warehouses_company_id ON public.warehouses(company_id);