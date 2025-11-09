-- Add tax_group_id to products table
ALTER TABLE public.products 
ADD COLUMN tax_group_id UUID REFERENCES public.tax_groups(id);