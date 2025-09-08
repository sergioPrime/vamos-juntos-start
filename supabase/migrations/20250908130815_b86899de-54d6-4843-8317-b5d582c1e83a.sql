-- Remove duplicate foreign key constraints on chart_account_cost_centers
ALTER TABLE public.chart_account_cost_centers DROP CONSTRAINT IF EXISTS fk_cacc_account;
ALTER TABLE public.chart_account_cost_centers DROP CONSTRAINT IF EXISTS fk_cacc_center;

-- Remove redundant unique index
DROP INDEX IF EXISTS public.uq_cacc_account_center;

-- Add updated_at column if it doesn't exist
ALTER TABLE public.chart_account_cost_centers ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Add trigger for updating updated_at
CREATE OR REPLACE TRIGGER update_chart_account_cost_centers_updated_at
    BEFORE UPDATE ON public.chart_account_cost_centers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();