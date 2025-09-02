-- Create warehouses table
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create units of measurement table
CREATE TABLE public.units_of_measurement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product categories table
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product lots table
CREATE TABLE public.product_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  product_id UUID NOT NULL,
  lot_number TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  expiration_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create product serials table
CREATE TABLE public.product_serials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  product_id UUID NOT NULL,
  serial_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  warehouse_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create product warehouse stock table
CREATE TABLE public.product_warehouse_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
);

-- Add new columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id UUID,
ADD COLUMN IF NOT EXISTS unit_id UUID,
ADD COLUMN IF NOT EXISTS max_stock_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_perishable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_lot_control BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_serial_control BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_warehouse_id UUID,
ADD COLUMN IF NOT EXISTS supplier_id UUID;

-- Add new columns to stock_movements table
ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS warehouse_id UUID,
ADD COLUMN IF NOT EXISTS lot_id UUID,
ADD COLUMN IF NOT EXISTS serial_id UUID,
ADD COLUMN IF NOT EXISTS expiration_date DATE;

-- Enable RLS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units_of_measurement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_warehouse_stock ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage warehouses from their organization" ON public.warehouses
FOR ALL USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));

CREATE POLICY "Users can view units of measurement" ON public.units_of_measurement
FOR SELECT USING (true);

CREATE POLICY "Users can manage categories from their organization" ON public.product_categories
FOR ALL USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));

CREATE POLICY "Users can manage lots from their organization" ON public.product_lots
FOR ALL USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));

CREATE POLICY "Users can manage serials from their organization" ON public.product_serials
FOR ALL USING (org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid()));

CREATE POLICY "Users can manage warehouse stock from their organization" ON public.product_warehouse_stock
FOR ALL USING (product_id IN (SELECT products.id FROM products WHERE products.org_id IN (SELECT user_organizations.org_id FROM user_organizations WHERE user_organizations.user_id = auth.uid())));

-- Insert default units
INSERT INTO public.units_of_measurement (name, symbol, description) VALUES
('Unidade', 'un', 'Unidade padrão'),
('Quilograma', 'kg', 'Quilograma'),
('Grama', 'g', 'Grama'),
('Litro', 'l', 'Litro'),
('Metro', 'm', 'Metro'),
('Centímetro', 'cm', 'Centímetro'),
('Caixa', 'cx', 'Caixa'),
('Pacote', 'pct', 'Pacote')
ON CONFLICT DO NOTHING;