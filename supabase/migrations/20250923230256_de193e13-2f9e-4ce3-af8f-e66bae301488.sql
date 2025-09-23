-- Create test data for inventory alerts
-- Update the existing product to have low stock
UPDATE public.products 
SET min_stock_level = 15, stock_quantity = 5
WHERE id = 'ac161d6f-90c2-4f3c-aa8d-04bdbe7cd7e5';

-- Insert test products with specific IDs to avoid conflicts
INSERT INTO public.products (id, org_id, owner_id, name, stock_quantity, min_stock_level, active, unit_price, cost_price)
VALUES 
  (gen_random_uuid(), '3f4bd408-ed6f-4f6a-aec4-8276a8153a98', '4c261b62-4077-4622-af4a-409bb250cef2', 'Açúcar Cristal', 0, 10, true, 5.50, 3.00),
  (gen_random_uuid(), '3f4bd408-ed6f-4f6a-aec4-8276a8153a98', '4c261b62-4077-4622-af4a-409bb250cef2', 'Farinha de Trigo Especial', 25, 20, true, 4.20, 2.80),
  (gen_random_uuid(), '3f4bd408-ed6f-4f6a-aec4-8276a8153a98', '4c261b62-4077-4622-af4a-409bb250cef2', 'Leite Integral UHT', 8, 15, true, 3.80, 2.50);