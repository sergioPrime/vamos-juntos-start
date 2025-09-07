-- Create table for N:N relationship between chart of accounts and cost centers
CREATE TABLE public.chart_account_cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chart_of_account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id) ON DELETE CASCADE,
  cost_center_id UUID NOT NULL REFERENCES public.cost_centers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(chart_of_account_id, cost_center_id)
);

-- Enable RLS
ALTER TABLE public.chart_account_cost_centers ENABLE ROW LEVEL SECURITY;

-- Create policies for chart_account_cost_centers
CREATE POLICY "Users can manage chart account cost centers from their organization" 
ON public.chart_account_cost_centers 
FOR ALL 
USING (
  chart_of_account_id IN (
    SELECT id FROM public.chart_of_accounts 
    WHERE org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  )
);