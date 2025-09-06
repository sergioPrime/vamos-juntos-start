-- Add new fields to products table for enhanced product management
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS validity_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'simple',
ADD COLUMN IF NOT EXISTS model text,
ADD COLUMN IF NOT EXISTS sale_unit text DEFAULT 'unit',
ADD COLUMN IF NOT EXISTS system_code text,
ADD COLUMN IF NOT EXISTS supplier_code text,
ADD COLUMN IF NOT EXISTS product_genre text DEFAULT '00',
ADD COLUMN IF NOT EXISTS inactive boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_in_sales boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS visible_in_catalog boolean DEFAULT true;