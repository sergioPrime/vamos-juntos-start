-- Create sales categories table
CREATE TABLE public.sales_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  moves_stock BOOLEAN NOT NULL DEFAULT false,
  moves_financial BOOLEAN NOT NULL DEFAULT false,
  visible_in_fiscal_operations BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.sales_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage sales categories from their organization" 
ON public.sales_categories 
FOR ALL 
USING (org_id IN (
  SELECT org_id FROM user_organizations 
  WHERE user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_sales_categories_updated_at
BEFORE UPDATE ON public.sales_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();