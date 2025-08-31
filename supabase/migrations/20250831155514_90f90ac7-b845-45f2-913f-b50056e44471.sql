-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  category TEXT,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'un',
  weight NUMERIC,
  dimensions TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products
CREATE POLICY "Users can view products from their organization" 
ON public.products 
FOR SELECT 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can insert products for their organization" 
ON public.products 
FOR INSERT 
WITH CHECK (
  org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  ) AND owner_id = auth.uid()
);

CREATE POLICY "Users can update products from their organization" 
ON public.products 
FOR UPDATE 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can delete products from their organization" 
ON public.products 
FOR DELETE 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Create orders table (pedidos/vendas)
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  customer_id UUID,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, confirmed, processing, completed, cancelled
  order_type TEXT NOT NULL DEFAULT 'sale', -- sale, purchase, return
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'pending', -- pending, partial, paid, refunded
  payment_method TEXT,
  notes TEXT,
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivery_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders
CREATE POLICY "Users can view orders from their organization" 
ON public.orders 
FOR SELECT 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can insert orders for their organization" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  ) AND owner_id = auth.uid()
);

CREATE POLICY "Users can update orders from their organization" 
ON public.orders 
FOR UPDATE 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can delete orders from their organization" 
ON public.orders 
FOR DELETE 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  product_id UUID,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for order_items
CREATE POLICY "Users can view order items from their organization" 
ON public.order_items 
FOR SELECT 
USING (order_id IN (
  SELECT orders.id
  FROM orders
  WHERE orders.org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  )
));

CREATE POLICY "Users can insert order items for their organization" 
ON public.order_items 
FOR INSERT 
WITH CHECK (order_id IN (
  SELECT orders.id
  FROM orders
  WHERE orders.org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  )
));

CREATE POLICY "Users can update order items from their organization" 
ON public.order_items 
FOR UPDATE 
USING (order_id IN (
  SELECT orders.id
  FROM orders
  WHERE orders.org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  )
));

CREATE POLICY "Users can delete order items from their organization" 
ON public.order_items 
FOR DELETE 
USING (order_id IN (
  SELECT orders.id
  FROM orders
  WHERE orders.org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  )
));

-- Create stock_movements table for inventory tracking
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  product_id UUID NOT NULL,
  movement_type TEXT NOT NULL, -- 'in', 'out', 'adjustment'
  quantity INTEGER NOT NULL,
  reference_type TEXT, -- 'order', 'adjustment', 'initial'
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS for stock_movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stock_movements
CREATE POLICY "Users can view stock movements from their organization" 
ON public.stock_movements 
FOR SELECT 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can insert stock movements for their organization" 
ON public.stock_movements 
FOR INSERT 
WITH CHECK (
  org_id IN (
    SELECT user_organizations.org_id
    FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
  ) AND created_by = auth.uid()
);

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'cash', 'card', 'pix', 'credit', 'debit', 'other'
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_methods
CREATE POLICY "Users can view payment methods from their organization" 
ON public.payment_methods 
FOR SELECT 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

CREATE POLICY "Users can manage payment methods for their organization" 
ON public.payment_methods 
FOR ALL 
USING (org_id IN (
  SELECT user_organizations.org_id
  FROM user_organizations
  WHERE user_organizations.user_id = auth.uid()
));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update product stock
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.movement_type = 'in' THEN
    UPDATE public.products 
    SET stock_quantity = stock_quantity + NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'INSERT' AND NEW.movement_type = 'out' THEN
    UPDATE public.products 
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'INSERT' AND NEW.movement_type = 'adjustment' THEN
    UPDATE public.products 
    SET stock_quantity = NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for stock updates
CREATE TRIGGER update_stock_on_movement
AFTER INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock();

-- Insert default payment methods for new organizations
INSERT INTO public.payment_methods (org_id, name, type) 
SELECT DISTINCT org_id, 'Dinheiro', 'cash' FROM public.organizations
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods pm 
  WHERE pm.org_id = organizations.id AND pm.name = 'Dinheiro'
);

INSERT INTO public.payment_methods (org_id, name, type) 
SELECT DISTINCT org_id, 'PIX', 'pix' FROM public.organizations
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods pm 
  WHERE pm.org_id = organizations.id AND pm.name = 'PIX'
);

INSERT INTO public.payment_methods (org_id, name, type) 
SELECT DISTINCT org_id, 'Cartão de Débito', 'debit' FROM public.organizations
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods pm 
  WHERE pm.org_id = organizations.id AND pm.name = 'Cartão de Débito'
);

INSERT INTO public.payment_methods (org_id, name, type) 
SELECT DISTINCT org_id, 'Cartão de Crédito', 'credit' FROM public.organizations
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods pm 
  WHERE pm.org_id = organizations.id AND pm.name = 'Cartão de Crédito'
);

-- Add indexes for better performance
CREATE INDEX idx_products_org_id ON public.products(org_id);
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_orders_org_id ON public.orders(org_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_payment_methods_org_id ON public.payment_methods(org_id);