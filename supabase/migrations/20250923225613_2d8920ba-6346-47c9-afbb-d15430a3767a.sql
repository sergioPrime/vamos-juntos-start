-- Fix foreign key relationships between stock_movements and products table
-- Add proper foreign key constraint

ALTER TABLE public.stock_movements 
DROP CONSTRAINT IF EXISTS stock_movements_product_id_fkey;

ALTER TABLE public.stock_movements
ADD CONSTRAINT stock_movements_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES public.products(id) 
ON DELETE CASCADE;

-- Fix foreign key relationships between product_lots and products table  
ALTER TABLE public.product_lots 
DROP CONSTRAINT IF EXISTS product_lots_product_id_fkey;

ALTER TABLE public.product_lots
ADD CONSTRAINT product_lots_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES public.products(id) 
ON DELETE CASCADE;