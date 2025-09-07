-- Create cost_centers table
CREATE TABLE public.cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT cost_centers_org_code_unique UNIQUE (org_id, code)
);

-- Enable RLS on cost_centers
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for cost_centers
CREATE POLICY "Users can manage cost centers from their organization"
ON public.cost_centers
FOR ALL
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Update chart_of_accounts table structure
ALTER TABLE public.chart_of_accounts 
ADD COLUMN IF NOT EXISTS nature_code TEXT,
ADD COLUMN IF NOT EXISTS is_expense BOOLEAN DEFAULT false;

-- Add cost_center_id and chart_of_account_id to financial_entries if not exists
ALTER TABLE public.financial_entries 
ADD COLUMN IF NOT EXISTS cost_center_id UUID,
ADD COLUMN IF NOT EXISTS chart_of_account_id UUID;

-- Create trigger for cost_centers updated_at
CREATE TRIGGER update_cost_centers_updated_at
  BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();