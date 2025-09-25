-- Add missing columns to products table if they don't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS track_stock BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 0;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 0;

-- Ensure order_items has the necessary columns
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS product_id UUID;