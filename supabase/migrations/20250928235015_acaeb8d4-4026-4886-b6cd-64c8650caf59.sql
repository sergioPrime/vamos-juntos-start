-- Create price tables
CREATE TABLE public.price_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  visible_in_pdv BOOLEAN NOT NULL DEFAULT true,
  auto_update_cost_changes BOOLEAN NOT NULL DEFAULT false,
  auto_update_commission_changes BOOLEAN NOT NULL DEFAULT false,
  default_seller_commission NUMERIC NOT NULL DEFAULT 0,
  default_representative_commission NUMERIC NOT NULL DEFAULT 0,
  default_mva NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create price table products (relationship between price tables and products)
CREATE TABLE public.price_table_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  price_table_id UUID NOT NULL,
  product_id UUID NOT NULL,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  seller_commission NUMERIC NOT NULL DEFAULT 0,
  representative_commission NUMERIC NOT NULL DEFAULT 0,
  mva NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(price_table_id, product_id)
);

-- Enable RLS
ALTER TABLE public.price_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_table_products ENABLE ROW LEVEL SECURITY;

-- Create policies for price_tables
CREATE POLICY "Users can manage price tables from their organization" 
ON public.price_tables 
FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Create policies for price_table_products
CREATE POLICY "Users can manage price table products from their organization" 
ON public.price_table_products 
FOR ALL 
USING (price_table_id IN (
  SELECT price_tables.id
  FROM price_tables
  WHERE price_tables.org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  )
));

-- Create trigger for updated_at on price_tables
CREATE TRIGGER update_price_tables_updated_at
BEFORE UPDATE ON public.price_tables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on price_table_products
CREATE TRIGGER update_price_table_products_updated_at
BEFORE UPDATE ON public.price_table_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint for price table names within organization
ALTER TABLE public.price_tables 
ADD CONSTRAINT unique_price_table_name_per_org 
UNIQUE (org_id, name);