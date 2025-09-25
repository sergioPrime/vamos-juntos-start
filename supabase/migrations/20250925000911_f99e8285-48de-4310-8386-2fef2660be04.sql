-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  customer_id UUID,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  order_type TEXT NOT NULL DEFAULT 'sale',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Users can manage orders from their organization" 
ON public.orders 
FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id 
  FROM user_organizations 
  WHERE user_organizations.user_id = auth.uid()
));

-- Create purchases table for real purchase integration
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  supplier_id UUID,
  purchase_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  received_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for purchases
CREATE POLICY "Users can manage purchases from their organization" 
ON public.purchases 
FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id 
  FROM user_organizations 
  WHERE user_organizations.user_id = auth.uid()
));

-- Create purchase_items table
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL,
  product_id UUID,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

-- Create policies for purchase_items
CREATE POLICY "Users can manage purchase items from their organization" 
ON public.purchase_items 
FOR ALL 
USING (purchase_id IN (
  SELECT purchases.id 
  FROM purchases 
  WHERE purchases.org_id IN (
    SELECT user_organizations.org_id 
    FROM user_organizations 
    WHERE user_organizations.user_id = auth.uid()
  )
));

-- Create function to generate next purchase number
CREATE OR REPLACE FUNCTION public.generate_next_purchase_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
  purchase_number TEXT;
BEGIN
  -- Find the highest purchase number for the organization
  SELECT COALESCE(MAX(CAST(SUBSTRING(purchase_number FROM '[0-9]+') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.purchases
  WHERE org_id = p_org_id
    AND purchase_number ~ '^PED[0-9]+$';
  
  -- Format as purchase number
  purchase_number := 'PED' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN purchase_number;
END;
$$;

-- Add trigger to auto-generate purchase numbers
CREATE OR REPLACE FUNCTION public.set_purchase_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.purchase_number IS NULL OR NEW.purchase_number = '' THEN
    NEW.purchase_number := public.generate_next_purchase_number(NEW.org_id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_purchase_number_trigger
  BEFORE INSERT ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_purchase_number();